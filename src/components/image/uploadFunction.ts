import { MediaImageAlbumType, MediaImageItemType } from "../../types/MediaImageDataType";
import axios from "axios";
import toast from "react-hot-toast";

export async function upload({
  isServerMode,
  files,
  imageItemList,
  album,
  tags: _tags,
  setImageFromUrl,
}: {
  isServerMode: boolean;
  files: File[];
  imageItemList: MediaImageItemType[];
  album: MediaImageAlbumType;
  tags: string | string[];
  setImageFromUrl: Function;
}) {
  const tags = typeof _tags === "string" ? [_tags] : _tags;
  const checkTime = new Date().getTime();
  const targetFiles = files.filter(
    (file) => {
      const findFunc = ({ src, originName }: MediaImageItemType) => [src, originName].some(n => n === file.name);
      const fromBrowser = Math.abs(checkTime - file.lastModified) < 200;
      if (fromBrowser) {
        return !imageItemList.some(findFunc)
      } else {
        const existTime = album.list.find(findFunc)?.time?.getTime();
        if (!existTime) return true;
        return Math.floor(existTime / 1000) !== Math.floor(file.lastModified / 1000);
      }
    }
  );
  if (targetFiles.length === 0) return;
  if (isServerMode) {
    const formData = new FormData();
    formData.append("dir", album.dir || "");
    tags.forEach((tag) => {
      formData.append("tags[]", tag);
    });
    targetFiles.forEach((file) => {
      formData.append("attached[]", file);
      if (file.lastModified)
        formData.append("attached_mtime[]", String(file.lastModified));
    });
    const res = await axios.post("/gallery/send", formData);
    if (res.status === 200) {
      toast("アップロードしました！", {
        duration: 2000,
      });
      setTimeout(() => {
        setImageFromUrl();
      }, 10 * targetFiles.length);
    }
  } else {
    toast.error("サーバーモードの場合のみアップロードできます", {
      duration: 2000,
    });
  }
}
