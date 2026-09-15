import sharp from "sharp";

const MAX_DIMENSION = 512;
const JPEG_QUALITY = 75;
// Reject absurdly large uploads before decoding, to avoid decompression-bomb style abuse
const MAX_INPUT_BYTES = 15 * 1024 * 1024;

// Thrown for any client-supplied avatar that isn't a valid, reasonably sized image
export class InvalidImageError extends Error {}

/**
 * Decodes a base64 image data URL and re-encodes it as a small JPEG (capped at
 * MAX_DIMENSION, quality JPEG_QUALITY). Throws InvalidImageError if the payload
 * isn't a valid, reasonably sized image so callers can reject the request with a 400.
 */
export async function compressImage(dataUrl: string): Promise<Buffer> {
  const base64 = dataUrl.split(",")[1];
  if (!base64) {
    throw new InvalidImageError("Malformed image data URL");
  }

  const inputBuffer = Buffer.from(base64, "base64");
  if (inputBuffer.length > MAX_INPUT_BYTES) {
    throw new InvalidImageError("Image is too large");
  }

  try {
    return await sharp(inputBuffer)
      .rotate() // respect EXIF orientation
      .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: "cover" })
      .jpeg({ quality: JPEG_QUALITY })
      .toBuffer();
  } catch (error) {
    throw new InvalidImageError("Uploaded file is not a valid image");
  }
}
