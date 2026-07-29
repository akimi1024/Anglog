// 長辺を maxSize に収めて JPEG 化。縮小のみ（拡大しない）。画像以外・失敗時は原本を返す
export async function resizeImage(
  file: File,
  maxSize = 1600,
  quality = 0.85,
): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  try {
    // createImageBitmap は File を直接読める＋EXIF回転も補正
    const bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
    });
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    if (scale >= 1) return file;

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    if (!blob) return file;

    const name = file.name.replace(/\.\w+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg" });
  } catch {
    return file;
  }
}
