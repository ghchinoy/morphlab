# MorphLab CLI (`morphcli`)

A powerful command-line interface companion to the MorphLab web application. This tool leverages Google's Gemini 3.1 Pro (and 2.5 Flash) models to programmatically analyze, simplify, animate, and vectorize complex scalable vector graphics and raster images.

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
*Outputs file size, exact counts of paths/polygons/rects, and provides an AI warning if the file is too large to animate reliably.*

### 2. Simplify Vectors (`simplify`)
If an SVG is too complex to animate (e.g., > 15KB), use this command. Gemini 3.1 Pro will act as an expert vector artist to intelligently redraw the SVG—merging overlapping shapes, simplifying bezier curves, and reducing precision—to output a clean, minimalist version of the graphic (< 5KB).
```bash
./morphcli simplify ../samples/cat.svg -o simplified_cat.svg
```

### 3. Text-to-Animation (`animate`)
Programmatically inject CSS keyframes or SMIL `<animate>` tags directly into an existing SVG via a plain-text prompt.
```bash
./morphcli animate ../samples/design.svg "make it spin smoothly" -o spinning_design.svg
```

### 4. Multimodal Vectorization (`vectorize`)
Pass a raw high-resolution raster image (`.png`, `.jpg`, `.jpeg`, `.webp`) directly to Gemini's vision encoder. The model will analyze the pixels and redraw the core subjects as a flat-vector, production-ready, semantic SVG.
```bash
./morphcli vectorize ../samples/wolf.png -o output_wolf.svg
```

## Global Flags
- `-o, --output string` : The destination path for the generated SVG (default is `transformed_output.svg`).

## Environment Variables
The CLI will automatically attempt to load your `.env` file from the current directory, or fallback to the parent directory.
- `GEMINI_API_KEY`: (Required) Your Google Gemini API Key.
- `GEMINI_MODEL`: (Optional) The model to use. Defaults to `gemini-3.1-pro-preview`.
