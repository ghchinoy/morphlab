# MorphLab Developer & Integration Guide

Welcome to the MorphLab (`svganimate`) developer guide. MorphLab is an AI-powered web application and CLI companion that transforms static SVG graphics into production-ready SMIL and CSS keyframe animations using **Google Gemini (`gemini-4-argon`)**.

## Project Structure

- `frontend/`: Lit 3 + TypeScript + Vite SPA.
  - `src/svg-animator-app.ts`: Root application shell, prompt bar, lightbox modal, and state orchestration.
  - `src/multi-source-uploader.ts`: Multi-tab input supporting `.svg` uploads, raster auto-tracing (`imagetracerjs`), and raw XML paste.
  - `src/svg-viewer.ts`: Sandboxed SVG preview & download component.
  - `src/history-carousel.ts`: Horizontal carousel backed by browser IndexedDB (`idb-keyval`).
  - `src/about-dialog.ts` & `src/error-toast.ts`: Contextual glossary modal and non-blocking error toast notifications.
  - `src/utils/svg.ts`: Shared SVG parsing, `viewBox` normalization, data-URI encoding, and complexity heuristics.
- `backend/`: Go HTTP server (`main.go`) serving the built frontend and proxying `/api/transform` and `/api/health` via `google.golang.org/genai`.
- `prototypes/`: Standalone Cobra CLI (`morphcli`) for analyzing, simplifying, and animating SVGs from the terminal.

## AI Pipeline & Authentication (`gemini-4-argon`)

Both the Go backend and `morphcli` use the official `google.golang.org/genai` SDK and default to **`gemini-4-argon`**.

Authentication is resolved automatically in the following order:
1. **Gemini API Key (`BackendGeminiAPI`)**: Used when `GEMINI_API_KEY` is present in `.env` or environment variables.
2. **Google Cloud Vertex AI (`BackendVertexAI`)**: Used when `GOOGLE_CLOUD_PROJECT` (and optional `GOOGLE_CLOUD_LOCATION`, defaulting to `global`) are configured without an API key—ideal for ADC (`gcloud auth application-default login`) and Cloud Run deployments.

## Sister App Integration (`Mattey Banana` & `VectorMatte`)

MorphLab is part of a vector-generation ecosystem alongside **[Mattey Banana](https://github.com/ghchinoy/mattey-banana)** and **[VectorMatte](https://github.com/ghchinoy/mattey-banana-app)**:

1. **Generate & Trace in Mattey Banana / VectorMatte**:
   - Create high-contrast stencil or concept art and trace it with the Rust/WASM `vtracer` engine.
   - Select **Graphic (Splines)** mode when exporting to SVG. This emits true Cubic Bézier (`C`) curves and semantic `<path id="island_N">` islands (< 15 KB) rather than dense CNC polylines.
2. **Animate in MorphLab**:
   - Drop the exported spline SVG into MorphLab (or run `morphcli animate design.svg "your prompt"`).
   - Because each geometric island is a distinct `<path>`, `gemini-4-argon` can animate individual elements cleanly without hitting output token limits.

## Quality Gates & Local Development

### Frontend
```bash
cd frontend
npm install
npm run lint     # ESLint + Prettier checks
npm run format   # Auto-format TypeScript/HTML/JSON
npm run build    # TypeScript typecheck + Vite production bundle
```

### Backend & CLI
```bash
cd backend
go vet ./...
go test -v ./...
go build -o morphlab-server .

cd ../prototypes
go vet ./...
go test -v ./...
go build -o morphcli .
```

## Cloud Run Deployment

Build locally with Docker:
```bash
docker build -t morphlab .
docker run -p 8080:8080 --env-file .env morphlab
```

Or deploy directly to Google Cloud Run:
```bash
export GOOGLE_CLOUD_PROJECT=your-project-id
./deploy.sh
```
