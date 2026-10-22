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
	"errors"
	"os"
	"strings"
	"time"

	"google.golang.org/genai"
)

const (
	defaultModelName  = "gemini-4-argon"
	generationTimeout = 3 * time.Minute
)

func resolveModelName() string {
	if envModel := strings.TrimSpace(os.Getenv("GEMINI_MODEL")); envModel != "" {
		return envModel
	}
	return defaultModelName
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

	return nil, errors.New("neither GEMINI_API_KEY nor GOOGLE_CLOUD_PROJECT is configured in environment or .env")
}

func callGemini(model, prompt string) (string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), generationTimeout)
	defer cancel()

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

	return cleanSVGOutput(text), nil
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
