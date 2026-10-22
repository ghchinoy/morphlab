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
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestResolveModelName(t *testing.T) {
	t.Setenv("GEMINI_MODEL", "")
	if got := resolveModelName(""); got != "gemini-4-argon" {
		t.Fatalf("expected default gemini-4-argon, got %q", got)
	}

	t.Setenv("GEMINI_MODEL", "gemini-4-argon-custom")
	if got := resolveModelName(""); got != "gemini-4-argon-custom" {
		t.Fatalf("expected env override, got %q", got)
	}

	if got := resolveModelName("explicit-model"); got != "explicit-model" {
		t.Fatalf("expected explicit model, got %q", got)
	}
}

func TestCleanSVGOutput(t *testing.T) {
	cases := []struct {
		name string
		raw  string
		want string
	}{
		{
			name: "fenced xml",
			raw:  "```xml\n<svg viewBox=\"0 0 10 10\"><circle r=\"5\"/></svg>\n```",
			want: `<svg viewBox="0 0 10 10"><circle r="5"/></svg>`,
		},
		{
			name: "fenced svg with surrounding text",
			raw:  "Here is your animated SVG:\n```svg\n<svg><rect width=\"10\" height=\"10\"/></svg>\n```\nEnjoy!",
			want: `<svg><rect width="10" height="10"/></svg>`,
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := cleanSVGOutput(tc.raw)
			if got != tc.want {
				t.Errorf("cleanSVGOutput() = %q, want %q", got, tc.want)
			}
			if !isValidSVGEnvelope(got) {
				t.Errorf("expected valid SVG envelope for %q", got)
			}
		})
	}
}

func TestHandleHealth(t *testing.T) {
	t.Setenv("GEMINI_MODEL", "")
	t.Setenv("GEMINI_API_KEY", "test-key")

	req := httptest.NewRequest(http.MethodGet, "/api/health", nil)
	rec := httptest.NewRecorder()
	handleHealth(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rec.Code)
	}

	var resp HealthResponse
	if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
		t.Fatalf("decode error: %v", err)
	}
	if resp.Model != "gemini-4-argon" {
		t.Errorf("expected model gemini-4-argon, got %q", resp.Model)
	}
	if resp.Backend != "gemini-api" {
		t.Errorf("expected backend gemini-api, got %q", resp.Backend)
	}
}

func TestHandleTransformValidationAndSuccess(t *testing.T) {
	origGenerator := svgGenerator
	defer func() { svgGenerator = origGenerator }()

	svgGenerator = func(_ context.Context, model, _ string) (string, error) {
		return "```svg\n<svg viewBox=\"0 0 100 100\"><circle cx=\"50\" cy=\"50\" r=\"40\"/></svg>\n```", nil
	}

	// 1. Method not allowed
	getReq := httptest.NewRequest(http.MethodGet, "/api/transform", nil)
	getRec := httptest.NewRecorder()
	handleTransform(getRec, getReq)
	if getRec.Code != http.StatusMethodNotAllowed {
		t.Fatalf("expected 405, got %d", getRec.Code)
	}

	// 2. Empty fields -> 400
	emptyBody, _ := json.Marshal(TransformRequest{SVG: "", Action: ""})
	badReq := httptest.NewRequest(http.MethodPost, "/api/transform", bytes.NewReader(emptyBody))
	badRec := httptest.NewRecorder()
	handleTransform(badRec, badReq)
	if badRec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for empty fields, got %d", badRec.Code)
	}

	// 3. Valid request -> 200
	validBody, _ := json.Marshal(TransformRequest{
		SVG:    `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40"/></svg>`,
		Action: "pulse gently",
	})
	okReq := httptest.NewRequest(http.MethodPost, "/api/transform", bytes.NewReader(validBody))
	okRec := httptest.NewRecorder()
	handleTransform(okRec, okReq)
	if okRec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", okRec.Code, okRec.Body.String())
	}

	var resp TransformResponse
	if err := json.NewDecoder(okRec.Body).Decode(&resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if !isValidSVGEnvelope(resp.Result) {
		t.Errorf("expected valid SVG result, got %q", resp.Result)
	}
}
