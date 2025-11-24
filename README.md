# EECE455 Steganography Suite

Interactive toolkit for hiding and recovering data inside audio, video, images, and text. The backend is a FastAPI service that handles steganography and encryption, and the frontend is a Vite/React UI with Tailwind for demos, encoding, decoding, and a short methodology walkthrough.

## Project layout
- `backend/` — FastAPI app (`backend/app.py`) exposing `/api/*` endpoints and stego helpers in `backend/stego/` (audio, video, image, text, ECC, crypto, ffmpeg utils).
- `project455/` — Vite + React frontend (`src/pages/index.tsx`) with tabs for Demo, Encode, Decode, and Learn, backed by `src/lib/steganography.ts` to call the API.
- `package-lock.json` (root) — unused placeholder; use the ones inside `project455/`.

## Prerequisites
- Python 3.11+ (tested with 3.12) and virtualenv support
- Node.js 18+ with npm
- ffmpeg available on PATH (or set `FFMPEG_PATH`)
- Git LFS not required; avoid using the committed `backend/venv` and create a fresh one

## Backend setup
```bash
cd backend
python -m venv .venv
. .venv/Scripts/activate  # Windows PowerShell: .venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Optional env vars
# CORS_ORIGIN=http://localhost:5173   # allow only the frontend origin
# PORT=3001                           # API port
# FFMPEG_PATH=ffmpeg                  # custom ffmpeg binary

uvicorn app:app --host 0.0.0.0 --port 3001 --reload
```

## Frontend setup
```bash
cd project455
npm install

# Optional: point UI at a remote API
# echo "VITE_API_BASE=http://localhost:3001" > .env.local

npm run dev   # launches Vite on http://localhost:5173
```

## API overview
- `POST /api/audio/embed` — LSB on WAV with AES-CTR + optional Hamming ECC; form-data: `carrier` (wav), `message` (file), `password`, `ecc`.
- `POST /api/audio/extract` — returns JSON `{message}` from stego WAV; form-data: `carrier`, `password`.
- `POST /api/image/embed` — converts carrier to BMP then LSB; XOR-protects payload; accepts text or `secret_file`; form-data: `carrier`, `password`, optional `message`/`secret_file`.
- `POST /api/image/extract` — returns `{message}` or `{file:{filename,data}}`; form-data: `carrier`, `password`.
- `POST /api/video/embed` — downsamples to 720p, embeds in frame LSB, remuxes audio; XOR payload; form-data: `carrier`, `password`, optional `message`/`secret_file`, `container` (mp4|mkv|mov|avi).
- `POST /api/video/extract` — reads payload header + body from LSBs; returns text or file JSON; form-data: `carrier`, `password`.
- `POST /api/text/embed` — uses `text_blind_watermark` to hide message inside host text; form-data: `host_text`, `message`, `password`.
- `POST /api/text/extract` — recovers hidden text; form-data: `watermarked_text`, `password`.

Responses that contain files return base64-encoded data so the frontend can reconstruct a download.

## How it works (quick)
- **Audio**: LSB embedding in WAV samples, AES-CTR encryption from password-derived key, optional Hamming ECC for robustness.
- **Image**: Carrier coerced to BMP for stable LSB; payload (text or file) JSON → XOR with password → base64 → LSB via `stegano`.
- **Video**: Downscale to 720p for capacity/speed; payload format matches image flow; bits spread across frame channels; audio stream reattached with ffmpeg.
- **Text**: `text_blind_watermark` to insert/extract a hidden watermark using the password.

## Using the UI
1) Start backend and frontend.  
2) In the UI, pick **Demo** to see the flow, **Encode** to hide content, **Decode** to recover, or **Learn** for methodology.  
3) Supply a carrier file or host text plus a password/key. Download or copy the stego output; later, provide the same password to decode.

## Troubleshooting
- ffmpeg missing → install it or set `FFMPEG_PATH`.  
- CORS errors → set `CORS_ORIGIN` on the backend to the frontend origin.  
- Payload too large → use a larger carrier (audio length, image resolution, or higher-frame-count video).
