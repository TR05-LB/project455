import type { Express } from "express";
import { Router } from "express";
import multer from "multer";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { embedLSB, extractLSB } from "../stego/audio.js";
import { ffmpeg } from "../utils/ffmpeg.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 1024 * 1024 * 1000 } });
const r = Router();

const getFieldFile = (files: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] } | undefined, field: string) => {
  if (!files || Array.isArray(files)) return undefined;
  return files[field]?.[0];
};

const toUint8Array = (file: Express.Multer.File): Uint8Array => {
  const out = new Uint8Array(file.buffer.length);
  out.set(file.buffer);
  return out;
};

r.post("/embed", upload.fields([{ name: "carrier" }, { name: "message" }]), async (req, res) => {
  try {
    const container = (req.body.container ?? "mkv").toLowerCase();
    const password = String(req.body.password ?? "");
    const ecc = String(req.body.ecc ?? "true") === "true";
    const carrier = getFieldFile(req.files, "carrier");
    const msg = getFieldFile(req.files, "message");
    if (!carrier || !msg || !password) return res.status(400).send("missing fields");

    const tmp = await mkdtemp(join(tmpdir(), "stego-"));
    const inVideo = join(tmp, "in.mp4");
    const outWav = join(tmp, "audio.wav");
    const stegoWav = join(tmp, "stego.wav");
    const outVideo = join(tmp, `out.${container}`);

    await writeFile(inVideo, Buffer.from(carrier.buffer));
    await ffmpeg(["-i", inVideo, "-vn", "-acodec", "pcm_s16le", outWav]);

    const wav = await readFile(outWav);
    const stego = embedLSB(Buffer.from(wav), toUint8Array(msg), password, ecc);
    await writeFile(stegoWav, stego);

    await ffmpeg(["-i", inVideo, "-i", stegoWav, "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "pcm_s16le", "-shortest", outVideo]);

    const file = await readFile(outVideo);
    res.setHeader("Content-Type", container === "mov" ? "video/quicktime" : "video/x-matroska");
    res.setHeader("Content-Disposition", `attachment; filename=\"stego.${container}\"`);
    res.send(file);
  } catch (e: any) {
    res.status(400).send(e.message ?? "error");
  }
});

r.post("/extract", upload.single("carrier"), async (req, res) => {
  try {
    const password = String(req.body.password ?? "");
    if (!req.file || !password) return res.status(400).send("missing fields");
    const tmp = await mkdtemp(join(tmpdir(), "stego-"));
    const inVideo = join(tmp, "in.mkv");
    const outWav = join(tmp, "audio.wav");
    await writeFile(inVideo, Buffer.from(req.file.buffer));
    await ffmpeg(["-i", inVideo, "-vn", "-acodec", "pcm_s16le", outWav]);
    const wav = await readFile(outWav);
    const plain = extractLSB(Buffer.from(wav), password);
    res.json({ message: new TextDecoder().decode(plain) });
  } catch (e: any) {
    res.status(400).send(e.message ?? "error");
  }
});

export default r;
