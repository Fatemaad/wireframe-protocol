# Wireframe Protocol — Deployment & Dependencies

A small web app that turns an uploaded photo into a white wireframe portrait (soldering next to "Axie" the robot), brands it with logos + coordinates, and lets the user share to LinkedIn / X. It can also produce an animated **looping GIF** where the character moves and smoke rises.

It is a **Node.js + Express** server that serves a single-page front end (`index.html`) and proxies image/video calls to the **xAI (Grok) Imagine API**. The API key lives only on the server.

---

## 1. What you need (dependencies)

| Dependency | Version | Why | Required? |
|---|---|---|---|
| **Node.js** | **18 or newer** | Server runtime; uses the built-in `fetch`/`FormData` | **Required** |
| **npm** | bundled with Node | Installs packages | **Required** |
| npm packages | see `package.json` | `express`, `multer`, `dotenv` | **Required** (installed via `npm install`) |
| **xAI (Grok) API key** | — | All image + video generation | **Required** |
| **ffmpeg** | any recent | Converts the Grok video into a looping GIF for the "Make it move" feature | **Only for the animated GIF.** The still-image app works without it. |

Install ffmpeg:
- macOS: `brew install ffmpeg`
- Debian/Ubuntu: `sudo apt-get install -y ffmpeg`
- Docker/most Linux images: add `ffmpeg` to the image

---

## 2. The API key (xAI / Grok)

The app calls xAI's **Imagine API**. You need an API key from <https://console.x.ai> with image + video (Imagine) access.

The key is read from an environment variable and **must never be committed to source control**.

Create a file named `.env` in the project root:

```
XAI_API_KEY=xai-your-real-key-here
```

Optional overrides (defaults shown):

```
PORT=3000
XAI_IMAGE_MODEL=grok-imagine-image-quality
```

### Which API endpoints are used
- `POST https://api.x.ai/v1/images/edits` — image generation (model `grok-imagine-image-quality`), multi-image edit (user photo + Axie reference).
- `GET  https://api.x.ai/v1/videos/{id}` and `POST https://api.x.ai/v1/videos/generations` — image-to-video (model `grok-imagine-video-1.5`) for the animated GIF.

### Cost (approximate — confirm on xAI's pricing page)
- Each still image: ~$0.05
- Video (for the GIF): ~$0.08 per second (~$0.40 for the default 5-second clip)

---

## 3. Required files & folders

Everything must sit together in one project folder:

```
index.html          # front end (served as the home page)
server.js           # Express server + API proxy
package.json        # dependencies
.env                # your XAI_API_KEY  (create this; do NOT commit)
um-white.svg        # Unicorn Mafia logo (loaded from project root)
assets/
  axie.png          # REQUIRED — the exact Axie reference sent to the model
  Anthropic.png     # header + composite logo
  axiometa.jpg      # header + composite logo
  <sponsor logos>   # any image files here are auto-loaded as sponsor logos
  style-ref.png     # OPTIONAL — a style-reference image to lock the look
```

Notes on `assets/`:
- **`axie.png` is required.** Without it the model has no Axie reference and results drift. The server logs a warning at startup if it's missing.
- Sponsor logos are picked up **automatically** — any image dropped into `assets/` appears in the sponsor row, **except** files whose names contain: `axie`, `axiometa`, `anthropic`, `um`/`unicorn`, `style-ref`, `seedcamp`. Rename a file to change whether it's treated as a sponsor.
- `style-ref.png` is optional; if present, the model is told to copy its wireframe style.
- `logos.js` is **not** required (logos now load from files); it can be deleted if present.

---

## 4. Run locally

```bash
npm install
# create .env with XAI_API_KEY (see section 2)
npm start
```

Open <http://localhost:3000>.

---

## 5. Deploying to a server

This is a standard Node web service. It needs a host that can:
1. Run **Node 18+**
2. Run **`npm install` / `npm start`**
3. (For the GIF feature) have **ffmpeg** available on the PATH
4. Provide the **`XAI_API_KEY`** as an environment variable / secret

### Good fits
- **Render / Railway / Fly.io / a VPS** — run `npm install` then `npm start`; set `XAI_API_KEY` as an env var; make sure ffmpeg is installed (on Render, add `apt-get install -y ffmpeg` in the build, or use a Docker image with ffmpeg).
- **Docker** — base on `node:18`, `apt-get install -y ffmpeg`, `npm ci`, `CMD ["npm","start"]`, pass `XAI_API_KEY` as a secret.

### Not suitable as-is
- Pure static hosts (GitHub Pages, plain S3/Netlify static) — there is a **server** component that holds the key and calls the API. A static host alone can't run it. (It could be adapted to serverless functions, but the current code is a long-running Express app, and the GIF step needs ffmpeg + longer execution time than most serverless defaults allow.)

### Important for the video/GIF endpoint
- `/api/animate` is **long-running** (~30–90s: it polls xAI, downloads a video, runs ffmpeg twice). Ensure the platform's **request timeout** is raised accordingly (many defaults are 30s and will cut it off).
- ffmpeg writes temp files to the OS temp dir; the host needs a writable temp filesystem (standard on all the platforms above).

---

## 6. Security / housekeeping

- **Never commit `.env`.** Add a `.gitignore` with at least:
  ```
  .env
  node_modules/
  .DS_Store
  ```
- The `assets/` folder contains third-party logos (Anthropic, Modal, Bambu, etc.). Confirm you have the right to display them before publishing.
- The key is only ever used server-side; the browser never sees it.

---

## 7. Endpoints (for reference)

| Method | Path | Purpose |
|---|---|---|
| GET | `/` | Serves `index.html` |
| GET | `/api/logos` | Lists sponsor logo filenames in `assets/` |
| POST | `/api/generate` | Multipart photo upload → returns the wireframe image (data URI) |
| POST | `/api/animate` | JSON `{image, overlay, duration}` → returns an animated GIF (needs ffmpeg) |
