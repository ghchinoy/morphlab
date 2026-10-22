# MorphLab

MorphLab is an advanced AI-powered web dashboard for animating and morphing SVG graphics. Utilizing Google's **Gemini 4 Argon (`gemini-4-argon`)** model and standard SVG techniques (SMIL `<animate>` tags, CSS keyframes), MorphLab transforms static scalable vector graphics into vibrant, dynamic, production-ready animations based on simple plain-text prompts.

![Image](https://github.com/user-attachments/assets/35a1602d-c389-438a-9784-67ab6ac2113d)

## Features

- **Generative Loop (History Carousel)**: All generated animations are stored locally in your browser via IndexedDB. Quickly click any previous generation to load its *Result* as your new *Source*, allowing infinite, iterative animation pipelines.
- **Multi-Source Input**: Upload native `.svg` files, auto-trace raster images (PNG/JPG/WebP) directly in the browser, or paste raw SVG XML.
- **Glassmorphic UI**: Clean, modern dark mode with neon accents, non-blocking toast notifications, and an interactive About & Glossary guide.
- **Robust Isolation**: Sandboxes generated CSS animations via data-URI encapsulation so multiple SVG iterations never conflict or bleed styles onto each other.
- **Preset Action Chips**: Avoid the "blank page" problem with pre-defined animation ideas that showcase Gemini's SVG coding capabilities.
- **Sister App Compatibility**: Designed to pair seamlessly with **[Mattey Banana](https://github.com/ghchinoy/mattey-banana)** and **[VectorMatte](https://github.com/ghchinoy/mattey-banana-app)** *Graphic (Splines)* SVG exports.

## Architecture

- **Frontend**: Vite, TypeScript, and Lit 3 WebComponents (`frontend/`).
- **Backend**: A lightweight Go server (`backend/`) using the official `google.golang.org/genai` SDK, supporting both Gemini API keys and Vertex AI authentication.
- **AI Model**: Powered by **`gemini-4-argon`** by default (configurable via `GEMINI_MODEL`).

## Setup Instructions

### 1. Prerequisites
- [Go 1.25+](https://golang.org/) (for the backend server and CLI)
- [Node.js 20+ & npm](https://nodejs.org/) (for the frontend)
- A Google Gemini API Key **or** a Google Cloud Project with Vertex AI enabled

### 2. Configure Environment
Copy `.env.example` to `.env` at the root of the project:
```env
GEMINI_API_KEY=your_actual_api_key_here
GEMINI_MODEL=gemini-4-argon
GOOGLE_CLOUD_PROJECT=your-gcp-project-id
GOOGLE_CLOUD_LOCATION=global
PORT=8080
```

### 3. Build the Frontend
```bash
cd frontend
npm install
npm run lint
npm run build
```

### 4. Run the Server
```bash
cd backend
go build -o morphlab-server .
./morphlab-server
```
Alternatively, if `8080` is in use:
```bash
PORT=8081 ./morphlab-server
```

### 5. Access the App
Open your browser and navigate to `http://localhost:8080`.

---

## Cloud Deployment

### Docker
```bash
docker build -t morphlab .
docker run -p 8080:8080 --env-file .env morphlab
```

### Google Cloud Run
```bash
export GOOGLE_CLOUD_PROJECT=your-project-id
./deploy.sh
```

---

## Prototyping Tools (`morphcli`)

A standalone CLI tool (`morphcli`) is provided inside the `prototypes/` directory for analyzing complexity, simplifying massive source SVGs, and animating graphics from the command line.

**For full command documentation (`analyze`, `simplify`, `animate`), see the [CLI README](prototypes/README.md) and [Developer Guide](DEVELOPER_GUIDE.md).**

## License
MorphLab is open-sourced under the [Apache 2.0 License](https://www.apache.org/licenses/LICENSE-2.0).

---

*Built with ❤️ using Gemini CLI and Stitch.*
