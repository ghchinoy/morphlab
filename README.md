# MorphLab

MorphLab is an advanced AI-powered web dashboard for animating and morphing SVG graphics. Utilizing Google's Gemini models and standard SVG techniques (SMIL `<animate>` tags, CSS keyframes), MorphLab transforms static scalable vector graphics into vibrant, dynamic, production-ready animations based on simple plain-text prompts.

![Image](https://github.com/user-attachments/assets/35a1602d-c389-438a-9784-67ab6ac2113d)

## Features

- **Generative Loop (History Carousel)**: All generated animations are stored locally in your browser via IndexedDB. Quickly click any previous generation to load its *Result* as your new *Source*, allowing infinite, iterative animation pipelines.
- **Glassmorphic UI**: Clean, modern dark mode with neon accents, inspired by advanced generative AI dashboards.
- **Robust Isolation**: The application architecture perfectly sandboxes generated CSS animations so that multiple SVG iterations do not conflict or bleed colors onto each other.
- **Preset Action Chips**: Avoid the "blank page" problem with pre-defined animation ideas that demonstrate the power of Gemini's SVG coding capabilities.
- **History Modal**: View and download full-resolution history elements in an elegant Lightbox context overlay.

## Architecture

- **Frontend**: Vite, TypeScript, and Lit WebComponents.
- **Backend**: A lightweight Go server proxying requests safely to the Gemini API, keeping your API key hidden from the client.
- **AI Model**: Designed to leverage Google's Gemini models (e.g., `gemini-2.5-flash` or `gemini-3.1-pro-preview`).

## Setup Instructions

### 1. Prerequisites
- [Go](https://golang.org/) (for the backend server)
- [Node.js & npm](https://nodejs.org/) (for the frontend)
- A Google Gemini API Key

### 2. Configure Environment
Create a `.env` file at the root of the project with your API key:
```env
GEMINI_API_KEY=your_actual_api_key_here
GEMINI_MODEL=gemini-2.5-flash
PORT=8080
```

### 3. Build the Frontend
```bash
cd frontend
npm install
npm run build
```

### 4. Run the Server
```bash
cd backend
go build -o morphlab-server main.go
./morphlab-server
```
Alternatively, if `8080` is in use:
```bash
PORT=8081 ./morphlab-server
```

### 5. Access the App
Open your browser and navigate to the port you ran the server on (e.g., `http://localhost:8080`).

---

## Prototyping Tools

A standalone CLI tool is provided inside the `prototypes/` directory for debugging complex prompts and massive source SVGs without booting the web server.
```bash
cd prototypes
go run test_transform.go ../samples/cat_design.svg "make it dance"
```
The output will be saved cleanly to `prototypes/transformed_output.svg`.

## License
MorphLab is open-sourced under the [Apache 2.0 License](https://www.apache.org/licenses/LICENSE-2.0).

---

*Built with ❤️ using Gemini CLI and Stitch.*
