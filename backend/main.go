// Copyright 2026 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/joho/godotenv"
	"google.golang.org/genai"
)

const (
	defaultModelName  = "gemini-4-argon"
	maxRequestBytes   = 5 << 20 // 5 MB
	generationTimeout = 3 * time.Minute
)

// TransformRequest represents the payload sent by the frontend to animate an SVG.
type TransformRequest struct {
	SVG    string `json:"svg"`
	Action string `json:"action"`
	Model  string `json:"model,omitempty"`
}

// TransformResponse represents the response returned by /api/transform.
type TransformResponse struct {
	Result string `json:"result,omitempty"`
	Model  string `json:"model,omitempty"`
	Error  string `json:"error,omitempty"`
}

// HealthResponse represents the status returned by /api/health.
type HealthResponse struct {
	Status  string `json:"status"`
	Model   string `json:"model"`
	Backend string `json:"backend"`
}

// svgGenerator abstracts the AI generation call for testability.
var svgGenerator = callGemini

func main() {
	if err := godotenv.Load(".env"); err != nil {
		_ = godotenv.Load("../.env")
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	staticDir := "../frontend/dist"
	if info, err := os.Stat("./frontend/dist"); err == nil && info.IsDir() {
		staticDir = "./frontend/dist"
	}

	mux := newServerMux(staticDir)

	srv := &http.Server{
		Addr:              ":" + port,
		Handler:           mux,
		ReadHeaderTimeout: 10 * time.Second,
		WriteTimeout:      generationTimeout + 15*time.Second,
		IdleTimeout:       60 * time.Second,
	}

	log.Printf("MorphLab server starting on http://localhost:%s (model: %s)", port, resolveModelName(""))
	if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Fatal(err)
	}
}

func newServerMux(staticDir string) *http.ServeMux {
	mux := http.NewServeMux()
	fs := http.FileServer(http.Dir(staticDir))
	mux.Handle("/", fs)
	mux.HandleFunc("/api/health", handleHealth)
	mux.HandleFunc("/api/transform", handleTransform)
	return mux
}

func resolveModelName(requested string) string {
	if strings.TrimSpace(requested) != "" {
		return strings.TrimSpace(requested)
	}
	if envModel := strings.TrimSpace(os.Getenv("GEMINI_MODEL")); envModel != "" {
		return envModel
	}
	return defaultModelName
}

func resolveBackendMode() string {
	if strings.TrimSpace(os.Getenv("GEMINI_API_KEY")) != "" {
		return "gemini-api"
	}
	if strings.TrimSpace(os.Getenv("GOOGLE_CLOUD_PROJECT")) != "" {
		return "vertex-ai"
	}
	return "unconfigured"
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		sendJSONError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(HealthResponse{
		Status:  "ok",
		Model:   resolveModelName(""),
		Backend: resolveBackendMode(),
	})
}

func handleTransform(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		sendJSONError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, maxRequestBytes)

	var req TransformRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("Error: Invalid request body: %v", err)
		sendJSONError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	req.SVG = strings.TrimSpace(req.SVG)
	req.Action = strings.TrimSpace(req.Action)

	if req.SVG == "" || req.Action == "" {
		sendJSONError(w, "Both 'svg' and 'action' fields are required", http.StatusBadRequest)
		return
	}

	log.Printf("Received transform request. Action: %q. Incoming SVG Size: %d bytes", req.Action, len(req.SVG))

	modelName := resolveModelName(req.Model)
	prompt := buildAnimationPrompt(req.SVG, req.Action)

	ctx, cancel := context.WithTimeout(r.Context(), generationTimeout)
	defer cancel()

	log.Printf("Sending payload to Gemini (%s)...", modelName)
	rawOutput, err := svgGenerator(ctx, modelName, prompt)
	if err != nil {
		log.Printf("Gemini Error: %v", err)
		sendJSONError(w, fmt.Sprintf("Failed to transform SVG: %v", err), http.StatusBadGateway)
		return
	}

	resultSVG := cleanSVGOutput(rawOutput)
	if !isValidSVGEnvelope(resultSVG) {
		log.Printf("Error: Gemini returned invalid or truncated SVG (%d bytes)", len(resultSVG))
		sendJSONError(w, "Model returned incomplete or invalid SVG markup. Please try again.", http.StatusUnprocessableEntity)
		return
	}

	log.Printf("Successfully received response from Gemini (%s). Resulting SVG Size: %d bytes", modelName, len(resultSVG))

	w.Header().Set("Content-Type", "application/json")
	if encodeErr := json.NewEncoder(w).Encode(TransformResponse{
		Result: resultSVG,
		Model:  modelName,
	}); encodeErr != nil {
		log.Printf("Error encoding response: %v", encodeErr)
	}
}

func buildAnimationPrompt(svgContent, action string) string {
	return fmt.Sprintf(`You are an expert SVG animator and designer.
I will give you an SVG file. I want you to transform it by applying the following action/animation: "%s".

CRITICAL INSTRUCTIONS:
1. Return ONLY the raw transformed SVG code. No markdown formatting like `+"```xml"+` or `+"```svg"+`.
2. Ensure the animation is done using standard SVG <animate>, <animateTransform>, or CSS embedded inside the SVG.
3. Keep the original viewBox and scaling intact but make it visually execute the requested action.
4. MAXIMUM LENGTH: You are constrained by a strict token limit. If the Original SVG is extremely complex or contains dense coordinate paths, DO NOT attempt to reconstruct it verbatim if it will cause you to truncate the file. You MUST aggressively simplify the geometry, merge paths, or lower coordinate precision so that the entire animated file can be written in a single response ending with </svg>. A truncated file is considered a complete failure.

Original SVG:
%s
`, action, svgContent)
}

func sendJSONError(w http.ResponseWriter, msg string, status int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if encodeErr := json.NewEncoder(w).Encode(TransformResponse{Error: msg}); encodeErr != nil {
		log.Printf("Error encoding error response: %v", encodeErr)
	}
}

func newGenAIClient(ctx context.Context) (*genai.Client, error) {
	apiKey := strings.TrimSpace(os.Getenv("GEMINI_API_KEY"))
	if apiKey != "" {
		return genai.NewClient(ctx, &genai.ClientConfig{
			APIKey:  apiKey,
			Backend: genai.BackendGeminiAPI,
		})
	}

	project := strings.TrimSpace(os.Getenv("GOOGLE_CLOUD_PROJECT"))
	if project != "" {
		location := strings.TrimSpace(os.Getenv("GOOGLE_CLOUD_LOCATION"))
		if location == "" {
			location = "global"
		}
		return genai.NewClient(ctx, &genai.ClientConfig{
			Project:  project,
			Location: location,
			Backend:  genai.BackendVertexAI,
		})
	}

	return nil, errors.New("neither GEMINI_API_KEY nor GOOGLE_CLOUD_PROJECT is configured")
}

func callGemini(ctx context.Context, model, prompt string) (string, error) {
	client, err := newGenAIClient(ctx)
	if err != nil {
		return "", err
	}

	temp := float32(0.2)
	resp, err := client.Models.GenerateContent(ctx, model, genai.Text(prompt), &genai.GenerateContentConfig{
		Temperature: &temp,
	})
	if err != nil {
		return "", err
	}

	text := strings.TrimSpace(resp.Text())
	if text == "" {
		return "", errors.New("empty response from Gemini")
	}
	return text, nil
}

func cleanSVGOutput(raw string) string {
	result := strings.TrimSpace(raw)
	result = strings.TrimPrefix(result, "```xml")
	result = strings.TrimPrefix(result, "```svg")
	result = strings.TrimPrefix(result, "```")
	result = strings.TrimSuffix(strings.TrimSpace(result), "```")
	result = strings.TrimSpace(result)

	startIdx := strings.Index(strings.ToLower(result), "<svg")
	endIdx := strings.LastIndex(strings.ToLower(result), "</svg>")
	if startIdx != -1 && endIdx != -1 && endIdx > startIdx {
		return strings.TrimSpace(result[startIdx : endIdx+len("</svg>")])
	}
	return result
}

func isValidSVGEnvelope(svg string) bool {
	lower := strings.ToLower(strings.TrimSpace(svg))
	return strings.HasPrefix(lower, "<svg") && strings.HasSuffix(lower, "</svg>")
}
