import { scryptSync, randomBytes, createCipheriv, createDecipheriv } from "crypto";

export function deriveKey(password: string): Buffer {
  const salt = Buffer.from("stego-fixed-salt");
  return scryptSync(password, salt, 32);
}

export function encryptCTR(key: Buffer, plain: Uint8Array) {
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-ctr", key, iv);
  return Buffer.concat([iv, cipher.update(plain), cipher.final()]);
}

export function decryptCTR(key: Buffer, data: Buffer) {
  const iv = data.subarray(0, 16);
  const cipher = createDecipheriv("aes-256-ctr", key, iv);
  return Buffer.concat([cipher.update(data.subarray(16)), cipher.final()]);
}
