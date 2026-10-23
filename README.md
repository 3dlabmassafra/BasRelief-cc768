# 3D Lab Massafra – Bas Relief Generator

A **single-page web application** that turns images or text prompts into downloadable 3D bas-relief models using the [Triverse AI](https://triverse.ai) API.

## ✨ Features

| Feature | Details |
|---|---|
| 🖼️ Image Upload | Drag & drop or click — PNG, JPG, WEBP, BMP (up to 20 MB) |
| ✏️ Text Prompt | Describe the scene in natural language |
| ⚙️ Settings | Depth scale, smoothness, thickness, output format (GLB/STL/OBJ) |
| 🎮 3D Viewer | Interactive GLB viewer via `<model-viewer>`, Three.js STL renderer |
| ⬇️ Download | One-click download of the generated model |
| 🔒 API Key | Stored in `localStorage` — never hardcoded |

## 🚀 Live Demo

**GitHub Pages URL:** https://3dlabmassafra.github.io/BasRelief/

## 🛠️ Getting Started

### Prerequisites
- A [Triverse AI](https://triverse.ai) account and API key

### Usage
1. Open the app (or run locally: just open `index.html` in your browser).
2. Paste your **Triverse AI API key** and click 💾 to save it.
3. Choose the **Upload Image** tab and drop an image, _or_ switch to **Text Prompt** and describe your scene.
4. (Optional) Expand **Advanced Parameters** to tune depth, smoothness, and thickness.
5. Select your preferred **Output Format** (GLB recommended for 3D preview).
6. Click **🚀 Generate Relief** and wait ~30–90 seconds.
7. Rotate the 3D preview, then click **⬇️ Download Model**.

## ⚠️ CORS Notice

The Triverse API may restrict browser-to-API requests (CORS). If you see a network error:

- **Option A:** Install a browser extension that disables CORS (e.g., *CORS Unblock* for Chrome) — for development only.
- **Option B:** Run a simple local proxy (e.g., `cors-anywhere`) and point the API base URL to it.
- **Option C:** Deploy a server-side proxy (e.g., Cloudflare Worker or Vercel Edge Function) that forwards requests with your key.

## 📁 Project Structure

```
BasRelief/
├── index.html          # Complete self-contained app
├── README.md           # This file
└── .github/
    └── workflows/
        └── deploy.yml  # GitHub Actions → GitHub Pages
```

## 🔧 API Integration

| Step | Detail |
|---|---|
| **Endpoint** | `POST https://api.triverse.ai/api/v1/relief/generate` (fallback: `/image-to-3d`) |
| **Auth** | `Authorization: Bearer <API_KEY>` |
| **Body** | `multipart/form-data`: `image`, `prompt`, `depth_scale`, `smoothness`, `thickness`, `format` |
| **Polling** | `GET /tasks/{task_id}` every 3 s until `status === "completed"` |
| **Result** | `data.model_url` or `data.output_url` — shown in viewer + downloadable |

## 📄 License

MIT © 2024 3D Lab Massafra
