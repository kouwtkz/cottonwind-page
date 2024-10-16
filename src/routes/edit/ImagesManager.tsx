import { useMemo } from "react";
import { useApiOrigin } from "@/state/EnvState";
import { GalleryObject } from "../GalleryPage";
import { useImageState } from "@/state/ImageState";
import { imageDataObject, ImportImagesJson } from "@/state/DataState";
import { MdDriveFileRenameOutline, MdFileUpload } from "react-icons/md";
import { useCharactersMap } from "@/state/CharacterState";
import { useParams } from "react-router-dom";
import { fileDialog } from "@/components/FileTool";
import { ImagesUploadWithToast } from "./ImageEditForm";
import { useToastProgress } from "@/state/ToastProgress";
import { concatOriginUrl } from "@/functions/originUrl";
import { arrayPartition, PromiseOrder } from "@/functions/arrayFunction";
import axios from "axios";
import {
  BaseObjectButtonProps,
  ImportObjectButtonProps,
  ObjectCommonButton,
} from "@/components/button/ObjectDownloadButton";

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
  children,
  from,
  to,
  ...props
}: CompatGalleryButtonProps) {
  const apiOrigin = useApiOrigin()[0];
  const setImagesLoad = imageDataObject.useLoad()[1];
  const { imageAlbums: albums } = useImageState();
  const { addProgress, setMax } = useToastProgress();
  return (
    <ObjectCommonButton
      title={`${from}アルバムを${to}アルバムに変更する`}
      icon={<MdDriveFileRenameOutline />}
      {...props}
      beforeConfirm={`${from}アルバムを${to}アルバムに変更しますか？`}
      onClick={() => {
        const url = concatOriginUrl(apiOrigin, "/image/send");
        const list = albums
          ?.get(from)
          ?.list.map((image) => ({ id: image.id, album: to }));
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
      }}
    >
      {children || `アルバムを${from}から${to}に移行する`}
    </ObjectCommonButton>
  );
}
