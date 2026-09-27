import type { Attachment } from "./types";

/** Reads a File into an Attachment; images are downscaled to ≤900px JPEG to fit localStorage. */
export async function fileToAttachment(file: File): Promise<Attachment> {
  const base = { name: file.name, type: file.type, size: file.size };
  if (!file.type.startsWith("image/")) return base;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 900 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return base;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return { ...base, dataUrl: canvas.toDataURL("image/jpeg", 0.72) };
  } catch {
    return base;
  }
}

export function fmtBytes(bytes: number): string {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
