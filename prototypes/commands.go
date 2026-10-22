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
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/spf13/cobra"
)

var outFile string

// SVGStats holds complexity metrics for an SVG document.
type SVGStats struct {
	SizeBytes int
	Paths     int
	Polygons  int
	Rects     int
	Circles   int
	Groups    int
	IsComplex bool
}

func init() {
	rootCmd.PersistentFlags().StringVarP(&outFile, "output", "o", "transformed_output.svg", "Output file path for the generated SVG")

	rootCmd.AddCommand(analyzeCmd)
	rootCmd.AddCommand(simplifyCmd)
	rootCmd.AddCommand(animateCmd)
}

func computeSVGStats(svgData []byte) SVGStats {
	str := string(svgData)
	size := len(svgData)
	return SVGStats{
		SizeBytes: size,
		Paths:     strings.Count(str, "<path"),
		Polygons:  strings.Count(str, "<polygon"),
		Rects:     strings.Count(str, "<rect"),
		Circles:   strings.Count(str, "<circle"),
		Groups:    strings.Count(str, "<g"),
		IsComplex: size > 15000,
	}
}

func analyzeSVG(svgData []byte) {
	stats := computeSVGStats(svgData)

	fmt.Println("========================================")
	fmt.Println("📊 SVG COMPLEXITY ANALYSIS")
	fmt.Println("========================================")
	fmt.Printf("File Size : %.2f KB\n", float64(stats.SizeBytes)/1024.0)
	fmt.Printf("Elements  : %d paths, %d polygons, %d rects, %d circles, %d groups\n",
		stats.Paths, stats.Polygons, stats.Rects, stats.Circles, stats.Groups)

	if stats.IsComplex {
		fmt.Println("⚠️ WARNING: This SVG is highly complex (> 15 KB).")
		fmt.Println("   AI models stream output token-by-token. Reconstructing this")
		fmt.Println("   is highly prone to timeouts or hitting maximum token limits.")
		fmt.Println("   Try: `morphcli simplify <file>` to ask Gemini to redraw it.")
	} else {
		fmt.Println("✅ This SVG is well-optimized for AI transformation!")
	}
	fmt.Println("========================================")
}

var analyzeCmd = &cobra.Command{
	Use:   "analyze [svg_file]",
	Short: "Analyze the complexity of an SVG file",
	Args:  cobra.ExactArgs(1),
	Run: func(cmd *cobra.Command, args []string) {
		svgData, err := os.ReadFile(args[0])
		if err != nil {
			log.Fatalf("Error reading file: %v", err)
		}
		analyzeSVG(svgData)
	},
}

var simplifyCmd = &cobra.Command{
	Use:   "simplify [svg_file]",
	Short: "Simplify a complex SVG using Gemini",
	Args:  cobra.ExactArgs(1),
	Run: func(cmd *cobra.Command, args []string) {
		svgData, err := os.ReadFile(args[0])
		if err != nil {
			log.Fatalf("Error reading file: %v", err)
		}
		analyzeSVG(svgData)

		prompt := "You are an expert vector artist and SVG optimizer.\n" +
			"I will provide a highly complex SVG file. I want you to redraw it as a vastly simplified, minimalist vector graphic.\n" +
			"Reduce the number of paths to an absolute minimum, merge overlapping shapes, simplify complex Bezier curves, and lower coordinate precision.\n" +
			"Maintain the semantic meaning, silhouette, and primary colors of the image, but heavily optimize it to be less than 5 KB.\n" +
			"Return ONLY the raw transformed SVG code. No markdown formatting like ```xml or ```svg. Just the pure raw SVG string starting with <svg> and ending with </svg>.\n\n" +
			"Original SVG:\n" + string(svgData)

		runGeminiProcess("simplify", prompt)
	},
}

var animateCmd = &cobra.Command{
	Use:   "animate [svg_file] [prompt]",
	Short: "Animate an SVG using a text prompt",
	Args:  cobra.ExactArgs(2),
	Run: func(cmd *cobra.Command, args []string) {
		svgData, err := os.ReadFile(args[0])
		if err != nil {
			log.Fatalf("Error reading file: %v", err)
		}

		prompt := "You are an expert SVG animator and designer.\n" +
			"I will give you an SVG file. I want you to transform it by applying the following action/animation: \"" + args[1] + "\".\n\n" +
			"CRITICAL INSTRUCTIONS:\n" +
			"1. Return ONLY the raw transformed SVG code. No markdown formatting like ```xml or ```svg.\n" +
			"2. Ensure the animation is done using standard SVG <animate>, <animateTransform>, or CSS embedded inside the SVG.\n" +
			"3. Keep the original viewBox and scaling intact but make it visually execute the requested action.\n" +
			"4. MAXIMUM LENGTH: You are constrained by a strict token limit. If the Original SVG is extremely complex or contains dense coordinate paths, DO NOT attempt to reconstruct it verbatim if it will cause you to truncate the file. You MUST aggressively simplify the geometry, merge paths, or lower coordinate precision so that the entire animated file can be written in a single response ending with </svg>. A truncated file is considered a complete failure.\n\n" +
			"Original SVG:\n" + string(svgData)

		runGeminiProcess("animate", prompt)
	},
}

func runGeminiProcess(actionName, prompt string) {
	modelName := resolveModelName()

	fmt.Printf("Invoking Gemini model: %s\n", modelName)
	fmt.Printf("Action: %s\n", actionName)
	fmt.Println("Waiting for response (large files may take several minutes)...")

	resultSVG, err := callGemini(modelName, prompt)
	if err != nil {
		log.Fatalf("Gemini Error: %v", err)
	}

	err = os.WriteFile(outFile, []byte(resultSVG), 0644)
	if err != nil {
		log.Fatalf("Error saving output: %v", err)
	}

	fmt.Printf("\n✨ Success! Output saved to %s\n", outFile)
	analyzeSVG([]byte(resultSVG))
}
