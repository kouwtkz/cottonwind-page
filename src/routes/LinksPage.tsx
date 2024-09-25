import axios from "axios";
import { useEffect, useMemo, useRef } from "react";
import { toast } from "react-toastify";
import { useSearchParams } from "react-router-dom";
import { useDataIsComplete } from "@/state/StateSet";
import { MakeRelativeURL } from "@/functions/doc/MakeURL";
import { LinksState, useFavLinks } from "@/state/LinksState";
import {
  useApiOrigin,
  useEnv,
  useIsLogin,
  useMediaOrigin,
} from "@/state/EnvState";
import { ImageMee } from "@/layout/ImageMee";
import { CreateState } from "@/state/CreateState";
import { AddButton, EditModeSwitch } from "./edit/CommonSwitch";
import { FavBannerEdit, useEditFavLinkID } from "./edit/LinksEdit";
import {
  ImagesUploadWithToast,
  useImageEditIsEditHold,
} from "./edit/ImageEditForm";
import { useImageState } from "@/state/ImageState";
import { concatOriginUrl } from "@/functions/originUrl";
import { useImageViewer } from "@/state/ImageViewer";
import { fileDialog } from "@/components/FileTool";
import { imageDataObject } from "@/state/DataState";

export default function LinksPage() {
  const [env] = useEnv();
  return (
    <div className="linkPage">
      <LinksState />
      <h2 className="color-main en-title-font">LINKS</h2>
      <div>
        <h3 className="leaf">各拠点</h3>
        <ul className="flex center column large">
          {env?.LINKS?.map((item, i) => {
            return (
              <li key={i}>
                <a href={item.url} target="_blank">
                  {item.title ?? item.name}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
      <div>
        <h3 className="leaf">いろいろ</h3>
        <ul className="flex center column large">
          <li>
            <InviteDiscordLink />
          </li>
          <li>
            <a href="/suggest">Suggest page (links for miss typo)</a>
          </li>
        </ul>
      </div>
      <MyBanners />
      <FavoriteLinks />
    </div>
  );
}

function InviteDiscordLink({
  children = "Discordのコミュニティサーバー",
}: {
  children?: React.ReactNode;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const anchorRef = useRef<HTMLAnchorElement>(null);
  const invite = searchParams.get("invite");
  const [isComplete] = useDataIsComplete();
  const question = useMemo(async () => {
    return axios.get("/fetch/discord/invite").then((r) => r.data);
  }, []);
  useEffect(() => {
    if (isComplete && invite === "discord") {
      anchorRef.current!.click();
      searchParams.delete("invite");
      setSearchParams(searchParams, {
        replace: true,
        preventScrollReset: true,
      });
    }
  }, [isComplete, invite]);
  return (
    <a
      title="Discordの招待リンク（合言葉入力式）"
      href="?invite=discord"
      target="discord"
      ref={anchorRef}
      onClick={async (e) => {
        const element = anchorRef.current!;
        if (!element.hasAttribute("invited")) {
          e.preventDefault();
          const answer = prompt(await question);
          if (answer) {
            axios
              .get(
                MakeRelativeURL({
                  pathname: "/fetch/discord/invite",
                  query: { invite_password: answer },
                })
              )
              .then((r) => {
                element.title = "Discordの招待リンク";
                element.href = r.data;
                element.setAttribute("invited", "");
                element.click();
              })
              .catch((e) => {
                toast.error(`認証に失敗しました [${e}]`);
              });
          }
        }
      }}
    >
      {children}
    </a>
  );
}

export const useBannersEditMode = CreateState(false);

const myBannerName = "myBanner";
export function MyBanners() {
  const edit = useImageEditIsEditHold()[0];
  const isLogin = useIsLogin()[0];
  const { imageAlbums } = useImageState();
  const album = imageAlbums?.get(myBannerName);
  const mediaOrigin = useMediaOrigin()[0];
  const setSearchParams = useSearchParams()[1];
  const { setImages } = useImageViewer();
  const apiOrigin = useApiOrigin()[0];
  const setImagesLoad = imageDataObject.useLoad()[1];
  useEffect(() => {
    setImages(album?.list || null);
  }, [setImages, album]);
  return (
    <div>
      <h3 className="leaf">サイトのバナー</h3>
      {isLogin ? (
        <div>
          <EditModeSwitch useSwitch={useImageEditIsEditHold} />
          <AddButton
            onClick={() => {
              fileDialog("image/*")
                .then((fileList) => fileList.item(0)!)
                .then((src) => {
                  return ImagesUploadWithToast({
                    src,
                    apiOrigin,
                    album: myBannerName,
                    albumOverwrite: false,
                    notDraft: true,
                  });
                })
                .then(async () => {
                  setImagesLoad("no-cache");
                });
            }}
          />
        </div>
      ) : null}
      <div className="bannerArea">
        {album?.list.map((image, i) => (
          <div key={i}>
            <div>
              {image.width}×{image.height} px
            </div>
            <a
              title={image.name || image.src || ""}
              href={concatOriginUrl(mediaOrigin, image.src)}
              target="banner"
              className="overlay"
              onClick={(e) => {
                if (edit) {
                  setSearchParams(
                    { image: image.key },
                    { preventScrollReset: true }
                  );
                  e.preventDefault();
                }
              }}
            >
              <ImageMee
                alt={`${image.width}×${image.height}バナー"`}
                className="banner"
                imageItem={image}
                autoPixel={false}
              />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

export const useFavoriteLinksEditMode = CreateState(false);

export function FavoriteLinks() {
  const list = useFavLinks()[0];
  const [edit, setEdit] = useEditFavLinkID();
  const isLogin = useIsLogin()[0];
  return (
    <div>
      {edit ? <FavBannerEdit /> : null}
      <h3 className="leaf">お気に入りのサイト</h3>
      {isLogin ? (
        <div>
          <EditModeSwitch useSwitch={useFavoriteLinksEditMode} />
          <AddButton
            onClick={() => {
              setEdit(true);
            }}
          />
        </div>
      ) : null}
      <div className="bannerArea">
        {list?.map((v, i) => (
          <BannerItem item={v} key={i} />
        ))}
      </div>
    </div>
  );
}

export function getTitleWithDsc(item: SiteLink) {
  return item.title + (item.description ? " - " + item.description : "");
}

export function BannerInner({
  item,
  title,
  alt,
}: {
  item?: SiteLink | null;
  title?: string;
  alt?: string;
}) {
  return (
    <>
      {item?.Image ? (
        <ImageMee
          className="banner"
          imageItem={item.Image}
          alt={alt || getTitleWithDsc(item)}
          autoPixel={false}
          style={{ width: 200, height: 40 }}
        />
      ) : item?.image ? (
        <img
          className="banner"
          src={item.image}
          width={200}
          height={40}
          alt={item.image}
        />
      ) : (
        <div style={{ width: 200, height: 40 }} className="banner">
          {title || item?.title}
        </div>
      )}
    </>
  );
}

export function BannerItem({ item }: { item: SiteLink }) {
  const isEdit = useFavoriteLinksEditMode()[0];
  const setEditLink = useEditFavLinkID()[1];
  const titleWithDsc = getTitleWithDsc(item);
  return (
    <a
      href={item.url || ""}
      title={titleWithDsc}
      target="_blank"
      className="overlay flex"
      onClick={(e) => {
        if (isEdit) {
          setEditLink(item.id);
          e.preventDefault();
        }
      }}
    >
      <BannerInner item={item} alt={titleWithDsc} />
    </a>
  );
}
