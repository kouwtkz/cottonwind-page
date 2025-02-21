import { Link, To, useLocation, useSearchParams } from "react-router-dom";
import { useImageState } from "@/state/ImageState";
import { getTimeframeTag, monthlyFilter } from "@/functions/media/FilterImages";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TransitionGroup, CSSTransition } from "react-transition-group";
import { ImageMee, ImgSwitch } from "@/layout/ImageMee";
import { usePosts } from "@/state/PostState";
import { findMee } from "@/functions/find/findMee";
import { CreateObjectState } from "@/state/CreateState";
import { MeeLinks } from "./LinksPage";
import { EmbedBluesky, EmbedTwitter } from "@/components/embed/EmbedSNS";
import { useEnv } from "@/state/EnvState";
import useSchedule from "@/components/hook/useSchedule";
import { shuffleArray } from "@/functions/arrayFunction";

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

interface TopImageType {
  topImage: ImageType | null;
  firstQue: ImageType[];
  firstQueIndex: number;
  topImages: ImageType[];
  topImageIndex: number;
  alwaysImages: ImageType[];
}
interface useTopImageType extends TopImageType {
  Next: () => void;
}
const useTopImage = CreateObjectState<useTopImageType>((set) => ({
  topImage: null,
  firstQue: [],
  firstQueIndex: 0,
  topImages: [],
  topImageIndex: 0,
  alwaysImages: [],
  Next() {
    set(({ topImages, topImageIndex, firstQue, firstQueIndex, topImage }) => {
      if (firstQue.length > firstQueIndex) {
        firstQueIndex++;
        if (firstQue.length > ++firstQueIndex) {
          topImage = firstQue[++firstQueIndex];
        } else {
          topImage = topImages[0];
        }
        return { topImage, firstQueIndex };
      } else if (topImages.length - 1 > topImageIndex) {
        topImage = topImages[++topImageIndex];
        return { topImage, topImageIndex };
      } else {
        return { topImageIndex: 0, topImage: topImages[0] };
      }
    });
  },
}));
export function HomeImageState() {
  const { set: setTopImage } = useTopImage();
  const { date } = useSchedule({ minute: 0, specify: true });
  const { imageAlbums } = useImageState();
  const timeframeTag = useMemo(() => getTimeframeTag(date), [date]);
  const images = useMemo(
    () => imageAlbums?.get("main")?.list ?? [],
    [imageAlbums]
  );
  useEffect(() => {
    const topImages = findMee(images, {
      where: {
        OR: [
          { AND: [{ topImage: { gte: 1 } }, { topImage: { lte: 3 } }] },
          { tags: { in: monthlyFilter?.tags }, topImage: { equals: null } },
          {
            tags: { contains: timeframeTag },
            AND: [{ topImage: { gte: 4 } }, { topImage: { lte: 6 } }],
          },
        ],
      },
      orderBy: [{ topImage: "desc" }],
    });
    const firstQue = topImages.filter(
      ({ topImage }) => topImage === 2 || topImage === 5
    );
    const alwaysImages = topImages.filter(
      ({ topImage }) => topImage === 3 || topImage === 6
    );
    shuffleArray(topImages);
    setTopImage({
      topImage: firstQue[0] || topImages[0],
      topImageIndex: 0,
      topImages,
      firstQueIndex: 0,
      firstQue,
      alwaysImages,
    });
  }, [images, timeframeTag]);
  return <></>;
}
export function HomeImage({ interval = 10000 }: { interval?: number }) {
  const { topImage, Next } = useTopImage();
  const nodeRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const timer = setInterval(() => {
      Next();
    }, interval);
    return () => {
      Next();
      return clearInterval(timer);
    };
  }, [interval]);
  const { pathname, state } = useLocation();
  const [searchParams] = useSearchParams();
  const toStatehandler = useCallback((): {
    to: To;
    state?: any;
    preventScrollReset?: boolean;
    title?: string;
  } => {
    if (!topImage) return { to: "" };
    if (topImage.direct) return { to: topImage.src ?? "" };
    searchParams.set("image", topImage.key);
    return {
      to: new URL("?" + searchParams.toString(), location.href).href,
      state: { ...state, from: pathname },
      preventScrollReset: true,
      title: topImage.title || undefined,
    };
  }, [topImage, searchParams]);
  return (
    <div className="HomeImage wide">
      {topImage ? (
        <TransitionGroup className="wrapper">
          <CSSTransition
            nodeRef={nodeRef}
            key={topImage.src || ""}
            timeout={750}
          >
            <Link className="item" {...toStatehandler()}>
              <ImageMee
                ref={nodeRef}
                imageItem={topImage}
                loading="eager"
                className="image"
              />
              <div
                className="gage"
                style={{
                  animationDuration: interval + "ms",
                }}
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
