import { useMemo } from "react";
import { useApiOrigin, useMediaOrigin } from "@/state/EnvState";
import { GalleryObject } from "../GalleryPage";
import { useImageState } from "@/state/ImageState";
import { imageDataObject, ImportImagesJson } from "@/state/DataState";
import { MdDriveFileRenameOutline, MdFileUpload } from "react-icons/md";
import { useCharactersMap } from "@/state/CharacterState";
import { useParams } from "react-router-dom";
import { fileDialog } from "@/components/FileTool";
import {
  ImagesUploadWithToast,
  useNoUploadThumbnail,
  useUploadWebp,
} from "./ImageEditForm";
import { useToastProgress } from "@/state/ToastProgress";
import { concatOriginUrl } from "@/functions/originUrl";
import { arrayPartition, PromiseOrder } from "@/functions/arrayFunction";
import axios from "axios";
import {
  BaseObjectButtonProps,
  ImportObjectButtonProps,
  ObjectCommonButton,
} from "@/components/button/ObjectDownloadButton";
import { getName } from "@/functions/doc/PathParse";
import { corsFetch } from "@/functions/fetch";
import { sleep } from "@/functions/Time";
import { PiFileImage, PiFileImageFill } from "react-icons/pi";
import { CreateState } from "@/state/CreateState";
import { ModeSwitch } from "@/layout/edit/CommonSwitch";

export function ImagesManager() {
  const { imageAlbums: albums } = useImageState();
  const items = useMemo(() => {
    return Object.values(Object.fromEntries(albums || []));
  }, [albums]);
  return (
    <main>
      <h2 className="color-main en-title-font">Images Manager</h2>
      <GalleryObject items={items} showInPageMenu={false} />
    </main>
  );
}

export function GalleryImportButton({
  overwrite = true,
  ...props
}: ImportObjectButtonProps) {
  const apiOrigin = useApiOrigin()[0];
  const setImagesLoad = imageDataObject.useLoad()[1];
  const charactersMap = useCharactersMap()[0];
  return (
    <ObjectCommonButton
      {...props}
      title="ギャラリーのデータベースへインポート"
      onClick={() => {
        ImportImagesJson({ apiOrigin, charactersMap, overwrite }).then(() => {
          setImagesLoad(overwrite ? "no-cache-reload" : "no-cache");
        });
      }}
    />
  );
}

interface GalleryUploadButtonProps extends BaseObjectButtonProps {
  group?: string;
}
export function GalleryUploadButton({
  group,
  ...props
}: GalleryUploadButtonProps) {
  const apiOrigin = useApiOrigin()[0];
  const setImagesLoad = imageDataObject.useLoad()[1];
  const webp = useUploadWebp()[0];
  const thumbnail = !useNoUploadThumbnail()[0];
  const params = useParams();
  return (
    <ObjectCommonButton
      {...props}
      title="アップロードする"
      icon={<MdFileUpload />}
      onClick={() => {
        fileDialog("image/*", true)
          .then((files) => Array.from(files))
          .then((files) =>
            ImagesUploadWithToast({
              src: files,
              apiOrigin,
              character: params.charaName,
              album: group,
              webp,
              thumbnail,
            })
          )
          .then(() => {
            setImagesLoad("no-cache");
          });
      }}
    />
  );
}

interface CompatGalleryButtonProps extends BaseObjectButtonProps {
  from: string;
  to: string;
}
export function CompatGalleryButton({
  className,
  children,
  from,
  to,
  ...props
}: CompatGalleryButtonProps) {
  className = useMemo(() => {
    const list = ["flex text-left"];
    if (className) list.push(className);
    return list.join(" ");
  }, [className]);
  const apiOrigin = useApiOrigin()[0];
  const setImagesLoad = imageDataObject.useLoad()[1];
  const { imageAlbums: albums } = useImageState();
  const { addProgress, setMax } = useToastProgress();
  return (
    <ObjectCommonButton
      title={`${from}アルバムを${to}アルバムに変更する`}
      icon={<MdDriveFileRenameOutline />}
      className={className}
      {...props}
      beforeConfirm={`${from}アルバムを${to}アルバムに変更しますか？`}
      onClick={() => {
        const url = concatOriginUrl(apiOrigin, "/image/send");
        const list = albums
          ?.get(from)
          ?.list.map((image) => ({ id: image.id, album: to }));
        if (!list) return;
        const doList = arrayPartition(list, 100).map(
          (items) => () =>
            axios
              .patch(url, items, {
                withCredentials: true,
              })
              .finally(() => {
                addProgress();
              })
        );
        setMax(doList.length);
        PromiseOrder(doList, { minTime: 200 }).then(() => {
          setImagesLoad("no-cache");
        });
      }}
    >
      {children || (
        <span className="pre">{`アルバムの移行\n${from}->${to}`}</span>
      )}
    </ObjectCommonButton>
  );
}

interface CompatMendingThumbnailButtonProps extends BaseObjectButtonProps {}
export function CompatMendingThumbnailButton({
  children,
  ...props
}: CompatMendingThumbnailButtonProps) {
  const apiOrigin = useApiOrigin()[0];
  const url = concatOriginUrl(apiOrigin, "/image/send");
  const mediaOrigin = useMediaOrigin()[0];
  const setImagesLoad = imageDataObject.useLoad()[1];
  const { images } = useImageState();
  const { addProgress, setMax } = useToastProgress();
  return (
    <ObjectCommonButton
      title={"ギャラリーのサムネイルを修復する"}
      icon={<MdDriveFileRenameOutline />}
      {...props}
      beforeConfirm={"ギャラリーのサムネイルを修復しますか？"}
      onClick={async () => {
        const noThumbnailList = (images || []).filter(
          (image) => image.src && !image.thumbnail
        );
        setMax(noThumbnailList.length, {
          message: "画像サーバーのみにあるサムネイルを取得しています…",
          success: null,
        });
        const list = (
          await PromiseOrder(
            noThumbnailList.map((image) => {
              const src = "image/thumbnail/" + getName(image.src!) + ".webp";
              return () =>
                fetch(concatOriginUrl(mediaOrigin, src), {
                  method: "HEAD",
                  cache: "no-cache",
                }).then((r) => (r.status === 200 ? { src, image } : null)!);
            }),
            {
              sync(i) {
                addProgress();
              },
            }
          )
        )
          .filter((v) => v)
          .map(({ src, image }) => ({ id: image.id, thumbnail: src }));
        if (list.length === 0) return;
        const doList = arrayPartition(list, 100).map(
          (items) => () =>
            axios
              .patch(url, items, {
                withCredentials: true,
              })
              .finally(() => {
                addProgress();
              })
        );
        setMax(doList.length, {
          message: "サムネイルを設定しています",
          autoClose: 1500,
        });
        PromiseOrder(doList, {
          minTime: 200,
        }).then(() => {
          setImagesLoad("no-cache");
        });
      }}
    >
      {children || "ギャラリーのサムネイルを修復する"}
    </ObjectCommonButton>
  );
}
