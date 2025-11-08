const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3001";

export async function encodeAudio(
  audioFile: File,
  message: string,
  key: string,
  onProgress?: (p: number) => void
): Promise<Blob> {
  onProgress?.(0.1);
  const fd = new FormData();
  fd.append("carrier", audioFile);
  fd.append("message", new Blob([message], { type: "text/plain" }), "msg.txt");
  fd.append("password", key);
  fd.append("ecc", "true");
  const res = await fetch(`${API_BASE}/api/audio/embed`, { method: "POST", body: fd });
  if (!res.ok) throw new Error(await res.text());
  onProgress?.(1);
  return await res.blob();
}

export async function decodeAudio(
  audioFile: File,
  key: string,
  onProgress?: (p: number) => void
): Promise<string> {
  onProgress?.(0.1);
  const fd = new FormData();
  fd.append("carrier", audioFile);
  fd.append("password", key);
  const res = await fetch(`${API_BASE}/api/audio/extract`, { method: "POST", body: fd });
  if (!res.ok) throw new Error(await res.text());
  onProgress?.(1);
  const { message } = await res.json();
  return message;
}

export async function encodeVideo(
  videoFile: File,
  message: string,
  key: string,
  onProgress?: (p: number) => void
): Promise<Blob> {
  onProgress?.(0.1);
  const fd = new FormData();
  fd.append("carrier", videoFile);
  fd.append("message", new Blob([message], { type: "text/plain" }), "msg.txt");
  fd.append("password", key);
  fd.append("ecc", "true");
  fd.append("container", "mkv");
  const res = await fetch(`${API_BASE}/api/video/embed`, { method: "POST", body: fd });
  if (!res.ok) throw new Error(await res.text());
  onProgress?.(1);
  return await res.blob();
}

export async function decodeVideo(
  videoFile: File,
  key: string,
  onProgress?: (p: number) => void
): Promise<string> {
  onProgress?.(0.1);
  const fd = new FormData();
  fd.append("carrier", videoFile);
  fd.append("password", key);
  const res = await fetch(`${API_BASE}/api/video/extract`, { method: "POST", body: fd });
  if (!res.ok) throw new Error(await res.text());
  onProgress?.(1);
  const { message } = await res.json();
  return message;
}

export function isVideoFile(file: File): boolean {
  return file.type.startsWith("video/") || /\.(mp4|avi|mov|wmv|flv|webm|mkv|m4v)$/i.test(file.name);
}

export function isAudioFile(file: File): boolean {
  return file.type.startsWith("audio/") || /\.(wav|mp3|ogg|flac|aac|m4a)$/i.test(file.name);
}

