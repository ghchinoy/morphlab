# MorphLab CLI (`morphcli`)

A command-line interface companion to the MorphLab web application. This tool leverages Google's **Gemini 4 Argon (`gemini-4-argon`)** model via the official `google.golang.org/genai` SDK to programmatically analyze, simplify, and animate scalable vector graphics.

## Features & Usage

Build the binary first from within this directory:
```bash
go build -o morphcli .
```

### 1. Analyze Complexity (`analyze`)
Some auto-traced SVGs output tens of thousands of coordinates, making them hundreds of kilobytes in size. Because AI models generate output token-by-token, passing a massive SVG and asking the AI to reconstruct it perfectly often hits token limits or causes timeouts.
```bash
./morphcli analyze ../samples/cat.svg
```
*Outputs file size, exact counts of paths/polygons/rects, and provides an AI warning if the file is too large (> 15 KB) to animate reliably.*

### 2. Simplify Vectors (`simplify`)
If an SVG is too complex to animate (e.g., > 15 KB), use this command. `gemini-4-argon` will act as an expert vector artist to intelligently redraw the SVG—merging overlapping shapes, simplifying Bézier curves, and reducing precision—to output a clean, minimalist version of the graphic (< 5 KB).
```bash
./morphcli simplify ../samples/cat.svg -o simplified_cat.svg
```

### 3. Text-to-Animation (`animate`)
Programmatically inject CSS keyframes or SMIL `<animate>` tags directly into an existing SVG via a plain-text prompt.
```bash
./morphcli animate ../samples/cat.svg "make it spin smoothly" -o spinning_cat.svg
```

## Global Flags
- `-o, --output string` : The destination path for the generated SVG (default is `transformed_output.svg`).

## Environment Variables
The CLI will automatically attempt to load your `.env` file from the current directory, or fallback to the parent directory.
- `GEMINI_API_KEY`: Your Google Gemini API Key (or use `GOOGLE_CLOUD_PROJECT` + `GOOGLE_CLOUD_LOCATION` for Vertex AI).
- `GEMINI_MODEL`: (Optional) The model to use. Defaults to `gemini-4-argon`.
