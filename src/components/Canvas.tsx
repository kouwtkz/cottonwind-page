export async function imageObject(
  src: string | Blob | MediaSource
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", reject);
    image.src = typeof src === "string" ? src : URL.createObjectURL(src);
  });
}

export function imageOverSizeCheck(image: HTMLImageElement, size: number) {
  const { naturalHeight, naturalWidth } = image;
  return naturalHeight * naturalWidth > size * size;
}

export interface resizeImageCanvasProps {
  src?: string | Blob | MediaSource;
  image?: HTMLImageElement;
  size?: number;
  type?: "jpeg" | "png" | "webp";
  quality?: number;
  expansion?: boolean;
  imageSmoothingEnabled?: boolean;
}
export async function resizeImageCanvas({
  src,
  image,
  size,
  type,
  quality = 1,
  expansion = true,
  imageSmoothingEnabled,
}: resizeImageCanvasProps) {
  if (!image && src) image = await imageObject(src);
  const context = document.createElement("canvas").getContext("2d");
  if (!image || context == null) throw "";
  const { naturalHeight, naturalWidth } = image;
  const resizable = Boolean(
    size && (expansion || imageOverSizeCheck(image, size))
  );
  const afterWidth = resizable
    ? naturalWidth > naturalHeight
      ? Math.floor(naturalWidth * (size! / naturalHeight))
      : size!
    : naturalWidth;
  const afterHeight = resizable
    ? naturalHeight > naturalWidth
      ? Math.floor(naturalHeight * (size! / naturalWidth))
      : size!
    : naturalHeight;
  context.canvas.width = afterWidth;
  context.canvas.height = afterHeight;
  if (typeof imageSmoothingEnabled === "boolean")
    context.imageSmoothingEnabled = imageSmoothingEnabled;
  context.drawImage(
    image,
    0,
    0,
    naturalWidth,
    naturalHeight,
    0,
    0,
    afterWidth,
    afterHeight
  );
  const jpegData = await new Promise((resolve) => {
    context.canvas.toBlob(resolve, `image/${type}`, quality);
  });
  return jpegData as Blob;
}