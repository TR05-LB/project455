import { Router } from "express";
import type { Express } from "express";
import multer from "multer";
import { embedLSB, extractLSB } from "../stego/audio.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 1024 * 1024 * 200 } });
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
    const carrier = getFieldFile(req.files, "carrier");
    const msg = getFieldFile(req.files, "message");
    const password = String(req.body.password ?? "");
    const ecc = String(req.body.ecc ?? "true") === "true";
    if (!carrier || !msg || !password) return res.status(400).send("missing fields");
    const out = embedLSB(Buffer.from(carrier.buffer), toUint8Array(msg), password, ecc);
    res.setHeader("Content-Type", "audio/wav");
    res.setHeader("Content-Disposition", "attachment; filename=\"stego.wav\"");
    res.send(out);
  } catch (e: any) {
    res.status(400).send(e.message ?? "error");
  }
});

r.post("/extract", upload.single("carrier"), async (req, res) => {
  try {
    if (!req.file || !req.body.password) return res.status(400).send("missing fields");
    const plain = extractLSB(Buffer.from(req.file.buffer), String(req.body.password));
    res.json({ message: new TextDecoder().decode(plain) });
  } catch (e: any) {
    res.status(400).send(e.message ?? "error");
  }
});

export default r;
