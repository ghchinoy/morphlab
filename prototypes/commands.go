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

func init() {
	rootCmd.PersistentFlags().StringVarP(&outFile, "output", "o", "transformed_output.svg", "Output file path for the generated SVG")

	rootCmd.AddCommand(analyzeCmd)
	rootCmd.AddCommand(simplifyCmd)
	rootCmd.AddCommand(animateCmd)
	rootCmd.AddCommand(vectorizeCmd)
}

func analyzeSVG(svgData []byte) {
	str := string(svgData)
	size := len(svgData)
	paths := strings.Count(str, "<path")
	polygons := strings.Count(str, "<polygon")
	rects := strings.Count(str, "<rect")
	circles := strings.Count(str, "<circle")
	groups := strings.Count(str, "<g")

	fmt.Println("========================================")
	fmt.Println("📊 SVG COMPLEXITY ANALYSIS")
	fmt.Println("========================================")
	fmt.Printf("File Size : %.2f KB\n", float64(size)/1024.0)
	fmt.Printf("Elements  : %d paths, %d polygons, %d rects, %d circles, %d groups\n", paths, polygons, rects, circles, groups)

	if size > 15000 {
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

		runGeminiProcess("simplify", prompt, nil, "")
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
			"I will give you an SVG file. I want you to transform it by applying the following action/animation: \"" + args[1] + "\".\n" +
			"Return ONLY the raw transformed SVG code. No markdown formatting like ```xml or ```svg. Just the pure raw SVG string starting with <svg> and ending with </svg>. Ensure the animation is done using standard SVG <animate>, <animateTransform>, or CSS embedded inside the SVG. Keep the original viewbox and scaling intact but make it visually execute the requested action.\n\n" +
			"Original SVG:\n" + string(svgData)

		runGeminiProcess("animate", prompt, nil, "")
	},
}

var vectorizeCmd = &cobra.Command{
	Use:   "vectorize [image_file]",
	Short: "Convert a PNG/JPEG image into a clean SVG using Gemini",
	Args:  cobra.ExactArgs(1),
	Run: func(cmd *cobra.Command, args []string) {
		imagePath := args[0]
		imageData, err := os.ReadFile(imagePath)
		if err != nil {
			log.Fatalf("Error reading image file: %v", err)
		}

		mimeType := "image/png"
		lowerPath := strings.ToLower(imagePath)
		if strings.HasSuffix(lowerPath, ".jpg") || strings.HasSuffix(lowerPath, ".jpeg") {
			mimeType = "image/jpeg"
		} else if strings.HasSuffix(lowerPath, ".webp") {
			mimeType = "image/webp"
		}

		fmt.Printf("Analyzing %s (%d bytes)...\n", mimeType, len(imageData))

		prompt := "You are an expert vector artist and technical illustrator. Convert the attached image into a crisp, clean, minimalist SVG graphic. " +
			"Recreate the core subjects of the image using semantic SVG paths, rects, circles, and solid fill colors. " +
			"Aim for a flat-vector illustration style. Do not use base64 embedded images, only native SVG vectors. " +
			"Ensure the graphic is production-ready, beautiful, and fully scalable. " +
			"Output ONLY the raw SVG XML code, starting with <svg> and ending with </svg>, without any markdown formatting or explanations."

		runGeminiProcess("vectorize", prompt, imageData, mimeType)
	},
}

func runGeminiProcess(actionName, prompt string, imageData []byte, mimeType string) {
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		log.Fatal("GEMINI_API_KEY not set in .env")
	}

	modelName := os.Getenv("GEMINI_MODEL")
	if modelName == "" {
		modelName = "gemini-3.1-pro-preview"
	}

	fmt.Printf("Invoking Gemini model: %s\n", modelName)
	fmt.Printf("Action: %s\n", actionName)
	fmt.Println("Waiting for response (large files may take several minutes)...")

	resultSVG, err := callGemini(modelName, apiKey, prompt, imageData, mimeType)
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
