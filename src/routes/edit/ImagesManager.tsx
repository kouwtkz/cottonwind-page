import { forwardRef, HTMLAttributes, ReactNode, useMemo } from "react";
import { useApiOrigin } from "@/state/EnvState";
import { GalleryObject } from "../GalleryPage";
import { useImageState } from "@/state/ImageState";
import { imageDataObject, ImportImagesJson } from "@/state/DataState";
import {
  MdDriveFileRenameOutline,
  MdFileDownload,
  MdFileUpload,
} from "react-icons/md";
import { TbDatabaseImport } from "react-icons/tb";
import { useCharactersMap } from "@/state/CharacterState";
import { useParams } from "react-router-dom";
import { fileDialog, fileDownload } from "@/components/FileTool";
import { ImagesUploadWithToast } from "./ImageEditForm";
import { useToastProgress } from "@/state/ToastProgress";
import { concatOriginUrl } from "@/functions/originUrl";
import { arrayPartition, PromiseOrder } from "@/functions/arrayFunction";
import axios from "axios";

export function ImagesManager() {
  const { imageAlbums: albums } = useImageState();
  const apiOrigin = useApiOrigin()[0];
  const setLoad = imageDataObject.useLoad()[1];
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

interface GalleryBaseButtonProps extends HTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
  iconClass?: string;
}
export const GalleryImportButton = forwardRef<
  HTMLButtonElement,
  GalleryBaseButtonProps
>(function GalleryImportButton(
  { children, icon = <TbDatabaseImport />, iconClass, ...props },
  ref
) {
  const apiOrigin = useApiOrigin()[0];
  const setImagesLoad = imageDataObject.useLoad()[1];
  const charactersMap = useCharactersMap()[0];
  return (
    <button
      type="button"
      title="ギャラリーデータベースのインポート"
      {...props}
      ref={ref}
      onClick={() => {
        ImportImagesJson({ apiOrigin, charactersMap }).then(() => {
          setImagesLoad("no-cache-reload");
        });
      }}
    >
      {icon ? <span className={iconClass}>{icon}</span> : null}
      {children ? <span className="text-bottom">{children}</span> : null}
    </button>
  );
});

interface GalleryUploadButtonProps extends GalleryBaseButtonProps {
  group?: string;
}
export const GalleryUploadButton = forwardRef<
  HTMLButtonElement,
  GalleryUploadButtonProps
>(function GalleryUploadButton(
  { group, icon = <MdFileUpload />, iconClass, children, ...props },
  ref
) {
  const apiOrigin = useApiOrigin()[0];
  const setImagesLoad = imageDataObject.useLoad()[1];
  const params = useParams();
  return (
    <button
      type="button"
      title="アップロードする"
      {...props}
      ref={ref}
      onClick={() => {
        fileDialog("image/*", true)
          .then((files) => Array.from(files))
          .then((files) =>
            ImagesUploadWithToast({
              src: files,
              apiOrigin,
              character: params.charaName,
              album: group,
            })
          )
          .then(() => {
            setImagesLoad("no-cache");
          });
      }}
    >
      {icon ? <span className={iconClass}>{icon}</span> : null}
      {children ? <span className="text-bottom">{children}</span> : null}
    </button>
  );
});

interface GalleryDownloadButtonProps extends GalleryBaseButtonProps {
  beforeConfirm?: boolean;
}
export const GalleryDownloadButton = forwardRef<
  HTMLButtonElement,
  GalleryDownloadButtonProps
>(function GalleryDownloadButton(
  { beforeConfirm, icon = <MdFileDownload />, iconClass, children, ...props },
  ref
) {
  return (
    <button
      type="button"
      title="ダウンロードする"
      {...props}
      ref={ref}
      onClick={async () => {
        if (
          !beforeConfirm ||
          confirm("ギャラリーのJSONデータをダウンロードしますか？")
        )
          fileDownload(
            imageDataObject.storage.key + ".json",
            JSON.stringify(imageDataObject.storage)
          );
      }}
    >
      {icon ? <span className={iconClass}>{icon}</span> : null}
      {children ? <span className="text-bottom">{children}</span> : null}
    </button>
  );
});

interface CompatGalleryButtonProps extends GalleryBaseButtonProps {
  beforeConfirm?: boolean;
}
export const CompatGalleryButton = forwardRef<
  HTMLButtonElement,
  CompatGalleryButtonProps
>(function CompatGalleryButton(
  {
    beforeConfirm = true,
    icon = <MdDriveFileRenameOutline />,
    iconClass,
    children,
    ...props
  },
  ref
) {
  const apiOrigin = useApiOrigin()[0];
  const setImagesLoad = imageDataObject.useLoad()[1];
  const { imageAlbums: albums } = useImageState();
  const { addProgress, setMax } = useToastProgress();
  return (
    <button
      type="button"
      title="artアルバムをmainアルバムに変更する"
      {...props}
      ref={ref}
      onClick={async () => {
        if (
          !beforeConfirm ||
          confirm("artアルバムをmainアルバムに変更しますか？")
        ) {
          const url = concatOriginUrl(apiOrigin, "/image/send");
          const list = albums
            ?.get("art")
            ?.list.map((image) => ({ id: image.id, album: "main" }));
          if (!list) return;
          const doList = arrayPartition(list, 200).map(
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
          PromiseOrder(doList, { sleepTime: 0 }).then(() => {
            setImagesLoad("no-cache");
          });
        }
      }}
    >
      {icon ? <span className={iconClass}>{icon}</span> : null}
      {children ? <span className="text-bottom">{children}</span> : null}
    </button>
  );
});
