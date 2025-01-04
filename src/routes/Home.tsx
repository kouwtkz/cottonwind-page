import { Link, To, useLocation, useSearchParams } from "react-router-dom";
import { useImageState } from "@/state/ImageState";
import { monthlyFilter } from "@/functions/media/FilterImages";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TransitionGroup, CSSTransition } from "react-transition-group";
import { ImageMee, ImgSwitch } from "@/layout/ImageMee";
import { usePosts } from "@/state/PostState";
import { findMee } from "@/functions/find/findMee";
import { CreateState } from "@/state/CreateState";
import { MeeLinks } from "./LinksPage";
import { EmbedBluesky, EmbedTwitter } from "@/components/embed/EmbedSNS";
import { useEnv } from "@/state/EnvState";

export default function Home() {
  const env = useEnv()[0];
  const enableHandle = Boolean(env?.BLUESKY_HANDLE || env?.TWITTER_HANDLE);
  return (
    <>
      <HomeImage />
      <div className="topPage wide">
        <ul className="topButtons">
          <li>
            <Link to="/gallery">
              <ImgSwitch
                src="/static/images/webp/button_gallery_default.webp"
                hoverSrc="/static/images/webp/button_gallery_hover.webp"
                alt="GALLERY"
                v="2"
              />
            </Link>
          </li>
          <li>
            <Link to="/character">
              <ImgSwitch
                src="/static/images/webp/button_character_default.webp"
                hoverSrc="/static/images/webp/button_character_hover.webp"
                alt="CHARACTER"
                v="2"
              />
            </Link>
          </li>
          <li>
            <Link to="/sound">
              <ImgSwitch
                src="/static/images/webp/button_sound_default.webp"
                hoverSrc="/static/images/webp/button_sound_hover.webp"
                alt="SOUND"
                v="2"
              />
            </Link>
          </li>
          <li>
            <Link to="/links">
              <ImgSwitch
                src="/static/images/webp/button_links_default.webp"
                hoverSrc="/static/images/webp/button_links_hover.webp"
                alt="LINKS"
                v="2"
              />
            </Link>
          </li>
          <li>
            <Link to="/works">
              <ImgSwitch
                src="/static/images/webp/button_works_default.webp"
                hoverSrc="/static/images/webp/button_works_hover.webp"
                alt="WORKS"
                v="2-2"
              />
            </Link>
          </li>
          <li>
            <Link to="/about">
              <ImgSwitch
                src="/static/images/webp/button_about_default.webp"
                hoverSrc="/static/images/webp/button_about_hover.webp"
                alt="ABOUT"
                v="2"
              />
            </Link>
          </li>
        </ul>
        <MeeLinks category="top" banner />
        <PostsView />
        {enableHandle ? (
          <div>
            <h3 className="leaf">つぶやき</h3>
            <div className="flex center row wrap m-c-s mb-c">
              <EmbedBluesky pin />
              <EmbedTwitter />
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}

function PostsView() {
  const Posts = usePosts()[0];
  const posts = useMemo(
    () =>
      findMee(Posts || [], {
        where: { draft: false, time: { lte: new Date() } },
        orderBy: [{ time: "desc" }],
      }),
    [Posts]
  );
  return (
    <div className="blog">
      <h3>
        <Link className="title en-title-font" to="/blog" title="ブログ">
          Blog
        </Link>
      </h3>
      <div className="list">
        {posts.slice(0, 3).map(({ time, title, postId }, i) => (
          <Link to={"/blog?postId=" + postId} className="article" key={i}>
            <div className="date">{time?.toLocaleDateString("ja")}</div>
            <div className="title">{title?.slice(0, 32)}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

const useTopImageFirst = CreateState(true);
export function HomeImage() {
  const { imageAlbums } = useImageState();
  const images = useMemo(
    () => imageAlbums?.get("main")?.list ?? [],
    [imageAlbums]
  );
  const topImages = useMemo(
    () =>
      findMee(images, {
        where: {
          OR: [
            { topImage: { gte: 1 } },
            { tags: { in: monthlyFilter?.tags }, topImage: { equals: null } },
          ],
        },
        orderBy: [{ topImage: "desc" }],
      }),
    [images, monthlyFilter]
  );
  const [topImageState, setTopImage] = useState<ImageType>();
  const [topImageFirstState, setTopImageFirst] = useTopImageFirst();
  const topImageFirst = useRef(topImageFirstState);
  const nodeRef = useRef<HTMLImageElement>(null);
  const currentTopImage = useRef<ImageType | null>(null);
  if (topImageState && currentTopImage) currentTopImage.current = topImageState;
  const topImage = currentTopImage.current;
  const setRndTopImage = () => {
    const curIndex = currentTopImage.current
      ? topImages.findIndex(
          (image) => image.src === currentTopImage.current?.src
        )
      : -1;
    let imageIndex = Math.floor(
      Math.random() * (topImages.length - (curIndex >= 0 ? 1 : 0))
    );
    if (curIndex >= 0 && curIndex <= imageIndex) imageIndex++;
    setTopImage(topImages[imageIndex]);
  };
  useEffect(() => {
    const topImageFirstFlag = topImageFirst.current;
    const topImageFlag = topImages[0]?.topImage;
    if (topImageFlag === 3 || (topImageFlag === 2 && topImageFirstFlag)) {
      setTopImage(topImages[0]);
    } else setRndTopImage();
    if (topImageFirstFlag) setTopImageFirst(false);
  }, [topImages, setTopImageFirst]);
  useEffect(() => {
    const timer = setInterval(() => {
      setRndTopImage();
    }, 10000);
    return () => clearInterval(timer);
  });
  const { pathname, state } = useLocation();
  const [searchParams] = useSearchParams();
  const toStatehandler = useCallback(
    ({
      image,
    }: {
      image: ImageType;
    }): {
      to: To;
      state?: any;
      preventScrollReset?: boolean;
      title?: string;
    } => {
      if (image.direct) return { to: image.src ?? "" };
      searchParams.set("image", image.key);
      return {
        to: new URL("?" + searchParams.toString(), location.href).href,
        state: { ...state, from: pathname },
        preventScrollReset: true,
        title: image.title || undefined,
      };
    },
    [searchParams, state]
  );
  return (
    <div className="HomeImage wide">
      {currentTopImage.current && topImage ? (
        <TransitionGroup className="wrapper">
          <CSSTransition
            nodeRef={nodeRef}
            key={currentTopImage.current.src || ""}
            timeout={750}
          >
            <Link className="item" {...toStatehandler({ image: topImage })}>
              <ImageMee
                ref={nodeRef}
                imageItem={topImage}
                loading="eager"
                className="image"
              />
            </Link>
          </CSSTransition>
        </TransitionGroup>
      ) : (
        <div className="dummy" />
      )}
    </div>
  );
}
