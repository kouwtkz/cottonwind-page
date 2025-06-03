import { getExtension } from "~/components/functions/doc/PathParse";
type HonoRequest<T = any> = any;

export function getIpAddress(req: HonoRequest<string>) {
  return req.header('cf-connecting-ip') || req.header('x-forwarded-for') || "anonymous";
}

export async function BucketRename(bucket: R2Bucket, before: string, after: string) {
  try {
    const object = await bucket.get(before);
    if (object) {
      await bucket.put(after, await object.arrayBuffer());
      await bucket.delete(before);
    }
    return object;
  } catch {
    return null;
  }
}

interface ImageBucketRenameProps {
  image: ImageDataType; rename: string; bucket: R2Bucket; entry?: Partial<ImageDataType>;
}
export async function ImageBucketRename({ image, rename, bucket, entry = {} }: ImageBucketRenameProps) {
  async function renamePut(
    mode: "src" | "thumbnail",
    rename: string
  ) {
    if (image[mode]) {
      await BucketRename(bucket, image[mode], rename).then((object) => {
        if (object) entry[mode] = rename;
      })
    }
  }
  const renameSrc = image.src
    ? rename + "." + getExtension(image.src)
    : null;
  const renameWebp = rename + ".webp";
  if (renameSrc) await renamePut("src", "image/" + renameSrc);
  await renamePut("thumbnail", "image/thumbnail/" + renameWebp);
  return entry;
}