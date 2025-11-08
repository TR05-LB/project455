import { parseWav } from "./wav.js";
import { deriveKey, encryptCTR, decryptCTR } from "./crypto.js";
import { bytesToBits, bitsToBytes, hammingEncode, hammingDecode } from "./ecc.js";

const MAGIC = Buffer.from("STG1");

export function embedLSB(wav: Buffer, payload: Uint8Array | Buffer, password: string, useECC = true) {
  const { dataOff, dataSize } = parseWav(wav);
  const key = deriveKey(password);
  const payloadView = payload instanceof Uint8Array ? payload : Uint8Array.from(payload);
  const encBuffer = encryptCTR(key, payloadView);
  const enc = new Uint8Array(Array.from(encBuffer));
  const flags = Buffer.from([useECC ? 1 : 0]);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(enc.length, 0);
  const header = Buffer.concat([MAGIC, flags, len]);
  let bits = bytesToBits(enc);
  if (useECC) bits = hammingEncode(bits);
  const bodyBytes = bitsToBytes(bits);
  const body = Buffer.from(bodyBytes);
  const full = Buffer.concat([header, body]);
  const totalBits = full.length * 8;
  const samples = dataSize / 2;
  if (totalBits > samples) throw new Error("Not enough capacity");
  for (let i = 0; i < totalBits; i++) {
    const byte = full[i >> 3];
    const bit = (byte >> (7 - (i & 7))) & 1;
    const byteOffset = dataOff + i * 2;
    wav[byteOffset] = (wav[byteOffset] & 0xfe) | bit;
  }
  return wav;
}

export function extractLSB(wav: Buffer, password: string): Uint8Array {
  const { dataOff, dataSize } = parseWav(wav);
  const samples = dataSize / 2;
  const readBits = (nBits: number, startBit = 0) => {
    const out = Buffer.alloc((nBits + 7) >> 3);
    for (let i = 0; i < nBits; i++) {
      const bit = wav[dataOff + (startBit + i) * 2] & 1;
      out[i >> 3] = (out[i >> 3] << 1) | bit;
    }
    const pad = out.length * 8 - nBits;
    if (pad) out[out.length - 1] <<= pad;
    return out;
  };
  const magic = readBits(32);
  if (magic.toString("ascii") !== "STG1") throw new Error("No payload found");
  const flags = readBits(8, 32)[0];
  const lenBuf = readBits(32, 40);
  const encLen = lenBuf.readUInt32BE(0);
  const bodyBits = flags ? Math.ceil((encLen * 8 * 7) / 4) : encLen * 8;
  if (72 + bodyBits > samples) throw new Error("Truncated payload");
  const rawBits: number[] = new Array(bodyBits);
  for (let i = 0; i < bodyBits; i++) rawBits[i] = wav[dataOff + (72 + i) * 2] & 1;
  const decodedBits = flags ? hammingDecode(rawBits) : rawBits;
  const encBytes = bitsToBytes(decodedBits).subarray(0, encLen);
  const key = deriveKey(password);
  const plainBuffer = decryptCTR(key, Buffer.from(encBytes));
  return new Uint8Array(Array.from(plainBuffer));
}
