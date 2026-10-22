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

import "testing"

func TestResolveModelName(t *testing.T) {
	t.Setenv("GEMINI_MODEL", "")
	if got := resolveModelName(); got != "gemini-4-argon" {
		t.Fatalf("expected gemini-4-argon, got %q", got)
	}

	t.Setenv("GEMINI_MODEL", "custom-model")
	if got := resolveModelName(); got != "custom-model" {
		t.Fatalf("expected custom-model, got %q", got)
	}
}

func TestCleanSVGOutput(t *testing.T) {
	raw := "```svg\n<svg viewBox=\"0 0 100 100\"><path d=\"M0 0 L10 10\"/></svg>\n```"
	got := cleanSVGOutput(raw)
	want := `<svg viewBox="0 0 100 100"><path d="M0 0 L10 10"/></svg>`
	if got != want {
		t.Fatalf("cleanSVGOutput() = %q, want %q", got, want)
	}
}

func TestComputeSVGStats(t *testing.T) {
	sample := []byte(`<svg><g><path d="M0 0"/><circle r="5"/></g></svg>`)
	stats := computeSVGStats(sample)
	if stats.Paths != 1 || stats.Circles != 1 || stats.Groups != 1 || stats.IsComplex {
		t.Fatalf("unexpected stats: %+v", stats)
	}
}
