import { Link, type To, useLocation, useSearchParams } from "react-router";
import { useImageState } from "~/components/state/ImageState";
import {
  getTimeframeTag,
  monthlyFilter,
} from "~/components/functions/media/FilterImages";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { TransitionGroup, CSSTransition } from "react-transition-group";
import { ImageMee, ImgSwitch } from "~/components/layout/ImageMee";
import { usePosts } from "~/components/state/PostState";
import { findMee } from "~/data/find/findMee";
import { CreateObjectState } from "~/components/state/CreateState";
import { MeeLinks } from "./LinksPage";
import { EmbedBluesky, EmbedTwitter } from "~/components/embed/EmbedSNS";
import useSchedule from "~/components/hook/useSchedule";
import {
  compareArray,
  shuffleArray,
} from "~/components/functions/arrayFunction";
import { ScheduleContainer } from "./SchedulePage";
import type { OmittedEnv } from "types/custom-configuration";

export default function Home({ env }: { env?: Partial<OmittedEnv> }) {
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
        <MeeLinks category="top" banner className="links" />
        <PostsView />
        <ScheduleContainer
          header={
            <h3>
              <Link
                className="title en-title-font"
                to="/schedule"
                title="スケジュール"
              >
                Schedule
              </Link>
            </h3>
          }
          defaultView="agenda"
        />
        {!import.meta.env.DEV && enableHandle ? <EmbedSNS /> : null}
      </div>
    </>
  );
}

const EmbedSNS = React.memo(function EmbedSNS() {
  return (
    <div>
      <h3 className="leaf">つぶやき</h3>
      <div className="flex center row wrap m-c-s mb-c">
        <EmbedBluesky pin />
        <EmbedTwitter />
      </div>
    </div>
  );
});

function PostsView() {
  let { posts } = usePosts();
  posts = useMemo(
    () =>
      findMee(posts || [], {
        where: { draft: { not: true }, time: { lte: new Date() } },
        index: "time",
        direction: "prev",
        take: 3,
      }),
    [posts]
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
  alwaysIndex: number;
  alwaysMode: boolean;
}
interface useTopImageType extends TopImageType {
  Next: (always?: boolean) => void;
}
const useTopImage = CreateObjectState<useTopImageType>((set) => ({
  topImage: null,
  firstQue: [],
  firstQueIndex: 0,
  topImages: [],
  topImageIndex: 0,
  alwaysImages: [],
  alwaysIndex: -1,
  alwaysMode: false,
  Next(always) {
    set(
      ({
        topImages,
        topImageIndex,
        firstQue,
        firstQueIndex,
        topImage,
        alwaysMode,
        alwaysIndex,
        alwaysImages,
      }) => {
        const value: Partial<TopImageType> = { alwaysMode };
        if (always && alwaysImages.length > 0) {
          value.alwaysMode = true;
        }
        if (firstQue.length > firstQueIndex + 1) {
          value.firstQueIndex = ++firstQueIndex;
          value.topImage = firstQue[firstQueIndex];
        } else {
          const switchTopImage = firstQue.length > firstQueIndex;
          if (switchTopImage) value.firstQueIndex = ++firstQueIndex;
          if (value.alwaysMode) {
            alwaysIndex = (alwaysIndex + 1) % alwaysImages.length;
            value.alwaysIndex = alwaysIndex;
            value.topImage = alwaysImages[alwaysIndex];
            value.alwaysMode = false;
          } else {
            if (switchTopImage) {
              value.topImage = topImages[0];
            } else if (topImages.length - 1 > topImageIndex) {
              value.topImageIndex = ++topImageIndex;
              value.topImage = topImages[topImageIndex];
            } else {
              value.topImageIndex = 0;
              value.topImage = topImages[0];
            }
          }
        }
        return value;
      }
    );
  },
}));
export function HomeImageState() {
  const { Set: setTopImage } = useTopImage();
  const { date } = useSchedule({ minute: 0, specify: true });
  const { imageAlbums } = useImageState();
  const timeframeTag = useMemo(() => getTimeframeTag(date), [date]);
  const images = useMemo(() => {
    return imageAlbums?.get("main")?.list ?? [];
  }, [imageAlbums]);
  useEffect(() => {
    if (images.length > 0) {
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
      setTopImage((state) => {
        if (!compareArray(state.topImages, topImages, { key: "key" })) {
          const firstQue = topImages
            .filter(({ topImage }) => topImage === 2 || topImage === 5)
            .sort((a, b) => (a.topImage === 2 && b.topImage !== 2 ? -1 : 0));
          const alwaysImages = topImages.filter(
            ({ topImage }) => topImage === 3 || topImage === 6
          );
          if (state.topImages.length !== topImages.length) {
            shuffleArray(topImages);
          }
          let topImage: ImageType | null | undefined;
          if (state.topImages.length === 0) {
            topImage = firstQue[0] || topImages[0];
          }
          return {
            topImage,
            topImageIndex: 0,
            topImages,
            firstQueIndex: 0,
            firstQue,
            alwaysImages,
          };
        }
      });
    }
  }, [images, timeframeTag]);
  return <></>;
}
export function HomeImage({ interval = 10000 }: { interval?: number }) {
  const { topImage, Next, topImages } = useTopImage();
  const nodeRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    if (topImages.length > 0) {
      const timer = setInterval(() => {
        Next();
      }, interval);
      return () => {
        if (timer) {
          Next(true);
          return clearInterval(timer);
        }
      };
    }
  }, [interval, topImages]);
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
