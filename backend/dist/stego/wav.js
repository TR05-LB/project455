export function parseWav(buf) {
    if (buf.subarray(0, 4).toString() !== "RIFF" || buf.subarray(8, 12).toString() !== "WAVE")
        throw new Error("Not RIFF/WAVE");
    let off = 12;
    let dataOff = -1, dataSize = 0, bitsPerSample = 0, audioFormat = 0, channels = 0;
    while (off + 8 <= buf.length) {
        const id = buf.subarray(off, off + 4).toString();
        const sz = buf.readUInt32LE(off + 4);
        if (id === "fmt ") {
            audioFormat = buf.readUInt16LE(off + 8);
            channels = buf.readUInt16LE(off + 10);
            bitsPerSample = buf.readUInt16LE(off + 22);
        }
        else if (id === "data") {
            dataOff = off + 8;
            dataSize = sz;
        }
        off += 8 + sz + (sz & 1);
    }
    if (audioFormat !== 1 || bitsPerSample !== 16)
        throw new Error("Require PCM 16-bit WAV");
    if (dataOff < 0)
        throw new Error("No data chunk");
    return { dataOff, dataSize, channels };
}
