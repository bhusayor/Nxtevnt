"use client";

export async function prepareEventImage(file: File, maxLength = 650_000): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Choose a JPG, PNG or WebP image.");
  if (!file.size || file.size > 12 * 1024 * 1024) throw new Error("Choose an image between 1 byte and 12 MB.");
  const objectUrl = URL.createObjectURL(file);
  try {
    const source = new window.Image();
    source.src = objectUrl;
    await source.decode();
    const longest = Math.max(source.naturalWidth, source.naturalHeight);
    if (!longest) throw new Error("This image could not be opened.");
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("This image could not be prepared.");
    for (const edge of [1400, 1150, 900, 700]) {
      const scale = Math.min(1, edge / longest);
      canvas.width = Math.max(1, Math.round(source.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(source.naturalHeight * scale));
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(source, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", edge > 900 ? 0.78 : 0.68);
      if (dataUrl.length < maxLength) return dataUrl;
    }
    throw new Error("This image is too detailed to save. Try a smaller photo.");
  } finally { URL.revokeObjectURL(objectUrl); }
}
