import { useCallback, useEffect, useMemo, useState } from "react";
import { useApiOrigin, useMediaOrigin } from "@src/state/EnvState";
import { GalleryObject, useGalleryObject } from "../GalleryPage";
import { useImageState } from "@src/state/ImageState";
import { imageDataIndexed, ImportImagesJson } from "@src/data/DataState";
import { MdDriveFileRenameOutline, MdFileUpload } from "react-icons/md";
import { useCharacters } from "@src/state/CharacterState";
import { useParams } from "react-router-dom";
import { fileDialog } from "@src/components/FileTool";
import {
  ImagesUpload,
  ImagesUploadWithToast,
  useNoUploadThumbnail,
  useUploadWebp,
} from "@src/layout/edit/ImageEditForm";
import { useToastProgress } from "@src/state/ToastProgress";
import { concatOriginUrl } from "@src/functions/originUrl";
import { arrayPartition, PromiseOrder } from "@src/functions/arrayFunction";
import axios from "axios";
import {
  BaseObjectButtonProps,
  ImportObjectButtonProps,
  ObjectCommonButton,
} from "@src/components/button/ObjectDownloadButton";
import { getName } from "@src/functions/doc/PathParse";
import { toast } from "react-toastify";
import {
  toastLoadingOptions,
  toastLoadingShortOptions,
} from "@src/components/define/toastContainerDef";
import { RiVideoUploadLine } from "react-icons/ri";

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
  const { charactersMap } = useCharacters();
  return (
    <ObjectCommonButton
      {...props}
      title="ギャラリーのデータベースへインポート"
      onClick={() => {
        ImportImagesJson({ apiOrigin, charactersMap, overwrite }).then(() => {
          imageDataIndexed.load(overwrite ? "no-cache-reload" : "no-cache");
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
            imageDataIndexed.load("no-cache");
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
          imageDataIndexed.load("no-cache");
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
  const { addProgress, setMax } = useToastProgress();
  return (
    <ObjectCommonButton
      title={"ギャラリーのサムネイルを修復する"}
      icon={<MdDriveFileRenameOutline />}
      {...props}
      beforeConfirm={"ギャラリーのサムネイルを修復しますか？"}
      onClick={async () => {
        const noThumbnailList =
          (await imageDataIndexed.table.find({
            where: {
              AND: [{ thumbnail: { has: false } }, { src: { has: true } }],
            },
          })) || [];
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
        if (list.length) {
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
          await PromiseOrder(doList, {
            minTime: 200,
          });
        }
        const thumbnailOnly = await imageDataIndexed.table.find({
          where: {
            AND: [{ thumbnail: { has: true } }, { src: { has: false } }],
          },
        });
        if (thumbnailOnly?.length) {
          await Promise.all(
            thumbnailOnly.map((image) =>
              axios.delete(url, { data: { id: image.id } })
            )
          ).then((v) => {
            toast(
              `使われていないサムネイルのみのファイルを${v.length}件削除しました`,
              toastLoadingOptions
            );
          });
        }
        imageDataIndexed.load("no-cache");
      }}
    >
      {children || "ギャラリーのサムネイルを修復する"}
    </ObjectCommonButton>
  );
}

interface uploadThumbnailProps {
  apiOrigin?: string;
  mediaOrigin?: string;
  image: ImageType | ImageType[];
  size?: number | boolean;
}
export function repostThumbnail({
  image,
  apiOrigin,
  mediaOrigin,
  size,
}: uploadThumbnailProps) {
  const images = Array.isArray(image) ? image : [image];
  return Promise.all(
    images
      .filter((image) => image.src)
      .map(async (image) => {
        if (image.src) {
          return ImagesUpload({
            src: concatOriginUrl(mediaOrigin, image.src),
            apiOrigin,
            original: false,
            thumbnail: size || true,
          });
        }
      })
  );
}

interface ThumbnailResetButtonProps extends BaseObjectButtonProps {}
export function ThumbnailResetButton({
  children,
  ...props
}: ThumbnailResetButtonProps) {
  const apiOrigin = useApiOrigin()[0];
  const mediaOrigin = useMediaOrigin()[0];
  const { images } = useGalleryObject();
  const { addProgress, setMax } = useToastProgress();
  const noThumbnailList = useMemo(
    () => images.filter((image) => image.src && !image.thumbnail),
    [images]
  );
  const onClick = useCallback(() => {
    if (noThumbnailList.length === 0) {
      toast("未設定のサムネイルはありません", toastLoadingShortOptions);
    } else if (
      confirm(
        `未設定だったギャラリーのサムネイル(${noThumbnailList.length}件)を設定しますか？`
      )
    ) {
      setMax(noThumbnailList.length, {
        success: null,
      });
      const doList = arrayPartition(noThumbnailList, 1).map(
        (image) => async () => {
          return repostThumbnail({
            image,
            apiOrigin,
            mediaOrigin,
          }).finally(() => {
            addProgress();
          });
        }
      );
      setMax(doList.length, {
        message: "サムネイルを設定しています",
        autoClose: 1500,
      });
      PromiseOrder(doList, {
        minTime: 200,
      }).then(() => {
        imageDataIndexed.load("no-cache");
      });
    }
  }, [noThumbnailList, apiOrigin, mediaOrigin]);
  return (
    <ObjectCommonButton
      title={"ギャラリーのサムネイルを再設定する"}
      icon={<RiVideoUploadLine />}
      {...props}
      onClick={onClick}
    >
      {children || "ギャラリーのサムネイルを再設定する"}
    </ObjectCommonButton>
  );
}
