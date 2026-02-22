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
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

type TransformRequest struct {
	SVG    string `json:"svg"`
	Action string `json:"action"`
}

type TransformResponse struct {
	Result string `json:"result"`
	Error  string `json:"error,omitempty"`
}

func main() {
	_ = godotenv.Load("../.env")

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fs := http.FileServer(http.Dir("../frontend/dist"))
	http.Handle("/", fs)
	http.HandleFunc("/api/transform", handleTransform)

	log.Printf("Server starting on http://localhost:%s", port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatal(err)
	}
}

func handleTransform(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error":"Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	var req TransformRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("Error: Invalid request body: %v", err)
		sendError(w, "Invalid request body")
		return
	}
	
	log.Printf("Received transform request. Action: %q. Incoming SVG Size: %d bytes", req.Action, len(req.SVG))

	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		log.Println("Error: GEMINI_API_KEY not set")
		sendError(w, "GEMINI_API_KEY not set")
		return
	}

	modelName := os.Getenv("GEMINI_MODEL")
	if modelName == "" {
		modelName = "gemini-3-flash-preview"
	}

	prompt := fmt.Sprintf(`You are an expert SVG animator and designer.
I will give you an SVG file. I want you to transform it by applying the following action/animation: "%s".
Return ONLY the raw transformed SVG code. No markdown formatting like \`+"`"+`xml or \`+"`"+`svg. Just the pure raw SVG string starting with <svg> and ending with </svg>. Ensure the animation is done using standard SVG <animate>, <animateTransform>, or CSS embedded inside the SVG. Keep the original viewbox and scaling intact but make it visually execute the requested action.

Original SVG:
%s
`, req.Action, req.SVG)

	log.Printf("Sending payload to Gemini (%s)...", modelName)
	resultSVG, err := callGemini(modelName, apiKey, prompt)
	if err != nil {
		log.Printf("Gemini Error: %v", err)
		sendError(w, "Failed to transform SVG: Model error or timeout")
		return
	}
	
	log.Printf("Successfully received response from Gemini. Resulting SVG Size: %d bytes", len(resultSVG))

	resultSVG = strings.TrimPrefix(strings.TrimSpace(resultSVG), "```xml")
	resultSVG = strings.TrimPrefix(resultSVG, "```svg")
	resultSVG = strings.TrimPrefix(resultSVG, "```")
	resultSVG = strings.TrimSuffix(strings.TrimSpace(resultSVG), "```")
	resultSVG = strings.TrimSpace(resultSVG)

	w.Header().Set("Content-Type", "application/json")
	if encodeErr := json.NewEncoder(w).Encode(TransformResponse{Result: resultSVG}); encodeErr != nil {
		log.Printf("Error encoding response: %v", encodeErr)
	}
}

func sendError(w http.ResponseWriter, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusInternalServerError)
	if encodeErr := json.NewEncoder(w).Encode(TransformResponse{Error: msg}); encodeErr != nil {
		log.Printf("Error encoding error response: %v", encodeErr)
	}
}

func callGemini(model, apiKey, prompt string) (string, error) {
	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", model, apiKey)

	payload := map[string]interface{}{
		"contents": []map[string]interface{}{
			{
				"parts": []map[string]interface{}{
					{"text": prompt},
				},
			},
		},
		"generationConfig": map[string]interface{}{
			"temperature": 0.2,
		},
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(body))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer func() {
		if closeErr := res.Body.Close(); closeErr != nil {
			log.Printf("Error closing response body: %v", closeErr)
		}
	}()

	var geminiResp struct {
		Candidates []struct {
			Content struct {
				Parts []struct {
					Text string `json:"text"`
				} `json:"parts"`
			} `json:"content"`
		} `json:"candidates"`
	}

	respBody, _ := io.ReadAll(res.Body)

	if res.StatusCode != 200 {
		return "", fmt.Errorf("API Error: %s", string(respBody))
	}

	if err := json.Unmarshal(respBody, &geminiResp); err != nil {
		return "", err
	}

	if len(geminiResp.Candidates) > 0 && len(geminiResp.Candidates[0].Content.Parts) > 0 {
		return geminiResp.Candidates[0].Content.Parts[0].Text, nil
	}

	return "", fmt.Errorf("empty response from Gemini")
}
