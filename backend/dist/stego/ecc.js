export function bytesToBits(b) {
    const out = new Array(b.length * 8);
    for (let i = 0; i < b.length; i++) {
        for (let k = 0; k < 8; k++) {
            out[i * 8 + k] = (b[i] >> (7 - k)) & 1;
        }
    }
    return out;
}
export function bitsToBytes(bits) {
    const out = new Uint8Array(Math.ceil(bits.length / 8));
    for (let i = 0; i < bits.length; i++) {
        out[i >> 3] |= (bits[i] & 1) << (7 - (i & 7));
    }
    return out;
}
export function hammingEncode(bits) {
    const out = [];
    for (let i = 0; i < bits.length; i += 4) {
        const d1 = bits[i] ?? 0, d2 = bits[i + 1] ?? 0, d3 = bits[i + 2] ?? 0, d4 = bits[i + 3] ?? 0;
        const p1 = d1 ^ d2 ^ d4, p2 = d1 ^ d3 ^ d4, p3 = d2 ^ d3 ^ d4;
        out.push(p1, p2, d1, p3, d2, d3, d4);
    }
    return out;
}
export function hammingDecode(bits) {
    const data = [];
    for (let i = 0; i < bits.length; i += 7) {
        const [p1, p2, d1, p3, d2, d3, d4] = [0, 1, 2, 3, 4, 5, 6].map((k) => bits[i + k] ?? 0);
        const s1 = p1 ^ d1 ^ d2 ^ d4, s2 = p2 ^ d1 ^ d3 ^ d4, s3 = p3 ^ d2 ^ d3 ^ d4;
        const syndrome = (s3 << 2) | (s2 << 1) | s1;
        const arr = [p1, p2, d1, p3, d2, d3, d4];
        if (syndrome >= 1 && syndrome <= 7)
            arr[syndrome - 1] ^= 1;
        data.push(arr[2], arr[4], arr[5], arr[6]);
    }
    return data;
}
