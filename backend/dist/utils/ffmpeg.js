import { spawn } from "node:child_process";
export function ffmpeg(args) {
    return new Promise((resolve, reject) => {
        const bin = process.env.FFMPEG_PATH || "ffmpeg";
        const p = spawn(bin, ["-y", ...args]);
        let err = "";
        p.stderr.on("data", (d) => {
            err += d.toString();
        });
        p.on("close", (code) => (code === 0 ? resolve() : reject(new Error(err || `ffmpeg exited ${code}`))));
    });
}
