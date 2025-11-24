import os
import tempfile
from typing import Optional, Tuple

import cv2
import numpy as np

from .image import embed_image, extract_image, ImageStegoError
from .ffmpeg_utils import run_ffmpeg, FFmpegError


class VideoStegoError(Exception):
    """Raised when video steganography operations fail."""


def _ensure_password(password: str) -> None:
    if not password:
        raise VideoStegoError("Password is required for video steganography")


import base64
import json

# ---- XOR encryption identical to image.py ----
def _encrypt(data: bytes, password: str) -> bytes:
    key = password.encode()
    return bytes([data[i] ^ key[i % len(key)] for i in range(len(data))])


def _decrypt(data: bytes, password: str) -> bytes:
    return _encrypt(data, password)  # XOR decrypt = encrypt


_MAGIC = b"VST2"   # 4-byte magic marker for video stego v2
_HEADER_SIZE = 8   # 4 bytes magic + 4 bytes payload length

# Reasonable limit to avoid Render 512 MB OOM
MAX_VIDEO_BYTES = 64 * 1024 * 1024  # 64 MB

# ---------------------------------------------------------------------
#                            EMBED VIDEO
# ---------------------------------------------------------------------
def embed_video(
    video_bytes: bytes,
    password: str,
    container: str = "mp4",
    *,
    secret_message: Optional[str] = None,
    secret_file: Optional[bytes] = None,
    secret_filename: Optional[str] = None,
) -> Tuple[bytes, str]:

    _ensure_password(password)

    if not secret_message and not secret_file:
        raise VideoStegoError("Either secret_message or secret_file must be provided")

    # ---- Size guard for 512 MB environments ----
    if len(video_bytes) > MAX_VIDEO_BYTES:
        raise VideoStegoError(
            "Video too large for this server plan. "
            "Please upload a shorter or lower-resolution video (<= 64 MB)."
        )

    container = (container or "mp4").lower()
    if not container.isalnum():
        container = "mp4"

    with tempfile.TemporaryDirectory(prefix="video-stego-") as tmpdir:

        # 1) Write uploaded video to disk
        input_path = os.path.join(tmpdir, "input.mp4")
        with open(input_path, "wb") as fh:
            fh.write(video_bytes)

        # 2) Downscale to 480p (lighter than 720p, safer for memory/CPU)
        scaled_path = os.path.join(tmpdir, "scaled_480p.mp4")
        try:
            run_ffmpeg(
                [
                    "-i",
                    input_path,
                    "-vf",
                    "scale=854:480",   # 480p instead of 720p
                    "-preset",
                    "fast",
                    scaled_path,
                ]
            )
        except FFmpegError:
            raise VideoStegoError("Failed to downscale video")

        # 3) Open downscaled video
        cap = cv2.VideoCapture(scaled_path)
        if not cap.isOpened():
            raise VideoStegoError("Unable to read downscaled video")

        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 0

        if width <= 0 or height <= 0:
            cap.release()
            raise VideoStegoError("Invalid video dimensions")

        # 4) Build payload in EXACT SAME FORMAT as image.py
        if secret_file is not None:
            payload_obj = {
                "type": "file",
                "filename": secret_filename or "secret.bin",
                "data": base64.b64encode(secret_file).decode("utf-8"),
            }
        else:
            payload_obj = {
                "type": "text",
                "data": secret_message,
            }

        raw = json.dumps(payload_obj).encode("utf-8")
        encrypted = _encrypt(raw, password)
        b64_encrypted = base64.b64encode(encrypted)  # bytes

        payload_len = len(b64_encrypted)  # in bytes
        header = _MAGIC + payload_len.to_bytes(4, "big")
        full_payload = header + b64_encrypted

        total_bits_needed = len(full_payload) * 8

        # Capacity of video in bits (1 LSB per channel)
        if frame_count <= 0:
            # Fallback: approximate by streaming once
            frame_count = 0
            while True:
                ok, frame = cap.read()
                if not ok:
                    break
                frame_count += 1
                del frame
            cap.release()
            cap = cv2.VideoCapture(scaled_path)
            if not cap.isOpened():
                raise VideoStegoError("Unable to re-open downscaled video")

        video_capacity_bits = frame_count * width * height * 3

        if total_bits_needed > video_capacity_bits:
            cap.release()
            raise VideoStegoError(
                f"Payload too large for this video. "
                f"Capacity: {video_capacity_bits} bits "
                f"(~{video_capacity_bits // 8} bytes), "
                f"required: {total_bits_needed} bits "
                f"(~{total_bits_needed // 8} bytes)."
            )

        # 5) Prepare writer for MJPG intermediate video (balanced: small but LSB-friendly)
        no_audio_path = os.path.join(tmpdir, "video_no_audio.mp4")
        fourcc = cv2.VideoWriter_fourcc(*"MJPG")
        writer = cv2.VideoWriter(no_audio_path, fourcc, fps, (width, height))
        if not writer.isOpened():
            cap.release()
            raise VideoStegoError("Unable to create intermediate output video")

        # Bit cursor into full_payload (MSB first)
        bit_index = 0
        total_bits = total_bits_needed

        def _get_next_bit() -> Optional[int]:
            nonlocal bit_index
            if bit_index >= total_bits:
                return None
            byte_i = bit_index // 8
            bit_in_byte = 7 - (bit_index % 8)  # MSB first
            bit = (full_payload[byte_i] >> bit_in_byte) & 1
            bit_index += 1
            return bit

        # 6) Embed bits across frames
        while True:
            ok, frame = cap.read()
            if not ok:
                break

            if bit_index < total_bits:
                flat = frame.reshape(-1)
                for i in range(flat.size):
                    bit = _get_next_bit()
                    if bit is None:
                        break
                    flat[i] = (flat[i] & 0xFE) | bit
                frame = flat.reshape(frame.shape)

            writer.write(frame)
            del frame  # free RAM immediately per frame

        writer.release()
        cap.release()

        if bit_index < total_bits:
            raise VideoStegoError(
                "Unexpected error: ran out of frames before embedding completed"
            )

        # 7) Merge audio back from original video WITHOUT re-encoding video
        output_path = os.path.join(tmpdir, f"stego_output.{container}")

        try:
            # Try to copy MJPG video stream as-is and add original audio
            run_ffmpeg(
                [
                    "-i",
                    no_audio_path,      # stego video (MJPG)
                    "-i",
                    input_path,         # original with audio
                    "-c:v",
                    "copy",             # NEVER re-encode video
                    "-map",
                    "0:v:0",
                    "-map",
                    "1:a:0",
                    "-shortest",
                    output_path,
                ]
            )
        except FFmpegError:
            # If anything goes wrong (no audio, mapping issue, etc.),
            # return the stego video WITHOUT audio – but still not re-encoded.
            output_path = no_audio_path
            container = "mp4"

        with open(output_path, "rb") as fh:
            final_bytes = fh.read()

        extension = os.path.splitext(output_path)[1].lstrip(".").lower()
        return final_bytes, extension


# ---------------------------------------------------------------------
#                            EXTRACT VIDEO
# ---------------------------------------------------------------------
def extract_video(
    video_bytes: bytes, password: str
) -> tuple[Optional[str], Optional[bytes], Optional[str]]:

    _ensure_password(password)

    # Same size limit for extraction (protects against massive uploads)
    if len(video_bytes) > MAX_VIDEO_BYTES:
        raise VideoStegoError(
            "Video too large for this server plan. "
            "Please upload a shorter or lower-resolution video (<= 64 MB)."
        )

    with tempfile.TemporaryDirectory(prefix="video-stego-") as tmpdir:
        # Extension doesn't really matter to OpenCV; mp4 is fine here
        video_path = os.path.join(tmpdir, "stego_video.mp4")
        with open(video_path, "wb") as fh:
            fh.write(video_bytes)

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise VideoStegoError("Unable to read stego video")

        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        if width <= 0 or height <= 0:
            cap.release()
            raise VideoStegoError("Invalid stego video dimensions")

        # Collect all bits first
        all_bits = []
        
        while True:
            ok, frame = cap.read()
            if not ok:
                break

            flat = frame.reshape(-1)
            for val in flat:
                all_bits.append(val & 1)
            
            del frame  # free RAM per frame

        cap.release()

        if len(all_bits) < _HEADER_SIZE * 8:
            raise VideoStegoError("No embedded payload found in video (insufficient bits)")

        # Reconstruct bytes using MSB-first ordering (matching embed)
        def _bits_to_bytes(bits):
            result = bytearray()
            for i in range(0, len(bits), 8):
                if i + 8 <= len(bits):
                    byte_val = 0
                    for j in range(8):
                        byte_val = (byte_val << 1) | bits[i + j]
                    result.append(byte_val)
            return bytes(result)

        # Extract header (first 8 bytes = 64 bits)
        header_bits = all_bits[:_HEADER_SIZE * 8]
        header_bytes = _bits_to_bytes(header_bits)

        # Validate magic
        if header_bytes[:4] != _MAGIC:
            raise VideoStegoError(
                "No embedded payload found in video (magic mismatch)"
            )
        
        payload_len = int.from_bytes(header_bytes[4:8], "big")
        if payload_len <= 0:
            raise VideoStegoError("Invalid embedded payload length")

        # Extract payload
        payload_bits_needed = payload_len * 8
        total_bits_needed = _HEADER_SIZE * 8 + payload_bits_needed

        if len(all_bits) < total_bits_needed:
            raise VideoStegoError("Stego video ended before payload was fully read")

        payload_bits = all_bits[_HEADER_SIZE * 8:total_bits_needed]
        payload_bytes = _bits_to_bytes(payload_bits)

        # Decode payload identically to image.py
        try:
            b64_encrypted = payload_bytes
            encrypted = base64.b64decode(b64_encrypted)
            raw = _decrypt(encrypted, password)
        except Exception:
            raise VideoStegoError("Incorrect password or corrupted payload")

        try:
            obj = json.loads(raw.decode("utf-8"))
        except Exception:
            raise VideoStegoError("Invalid embedded data format")

        if obj.get("type") == "text":
            return obj.get("data"), None, None

        if obj.get("type") == "file":
            try:
                file_bytes = base64.b64decode(obj["data"])
            except Exception:
                raise VideoStegoError("Corrupted embedded file data")
            filename = obj.get("filename") or "secret.bin"
            return None, file_bytes, filename

        raise VideoStegoError("Unknown embedded payload type")