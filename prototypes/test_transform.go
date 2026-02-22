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

func main() {
	if len(os.Args) < 3 {
		fmt.Println("Usage: go run test_transform.go <path_to_svg> <action>")
		os.Exit(1)
	}

	svgPath := os.Args[1]
	action := os.Args[2]

	svgData, err := os.ReadFile(svgPath)
	if err != nil {
		log.Fatalf("Error reading SVG file: %v", err)
	}

	_ = godotenv.Load("../.env")

	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		log.Fatal("GEMINI_API_KEY not set in .env")
	}

	modelName := os.Getenv("GEMINI_MODEL")
	if modelName == "" {
		modelName = "gemini-2.5-flash"
	}

	prompt := "You are an expert SVG animator and designer.\n" +
		"I will give you an SVG file. I want you to transform it by applying the following action/animation: \"" + action + "\".\n" +
		"Return ONLY the raw transformed SVG code. No markdown formatting like ```xml or ```svg. Just the pure raw SVG string starting with <svg> and ending with </svg>. Ensure the animation is done using standard SVG <animate>, <animateTransform>, or CSS embedded inside the SVG. Keep the original viewbox and scaling intact but make it visually execute the requested action.\n\n" +
		"Original SVG:\n" + string(svgData)

	fmt.Printf("Invoking Gemini model: %s\n", modelName)
	fmt.Printf("Action: %s\n", action)
	fmt.Println("Waiting for response...")

	resultSVG, err := callGemini(modelName, apiKey, prompt)
	if err != nil {
		log.Fatalf("Gemini Error: %v", err)
	}

	resultSVG = strings.TrimPrefix(strings.TrimSpace(resultSVG), "```xml\n")
	resultSVG = strings.TrimPrefix(resultSVG, "```svg\n")
	resultSVG = strings.TrimPrefix(resultSVG, "```\n")
	resultSVG = strings.TrimSuffix(strings.TrimSpace(resultSVG), "\n```")
	resultSVG = strings.TrimSpace(resultSVG)

	outPath := "transformed_output.svg"
	err = os.WriteFile(outPath, []byte(resultSVG), 0644)
	if err != nil {
		log.Fatalf("Error saving output: %v", err)
	}

	fmt.Printf("Success! Transformed SVG saved to %s\n", outPath)
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
	defer res.Body.Close()

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
