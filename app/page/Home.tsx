import { Link, type To, useSearchParams } from "react-router";
import { useImageState } from "~/components/state/ImageState";
import {
  getTimeframeTag,
  monthlyFilter,
} from "~/components/functions/media/FilterImages";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { TransitionGroup, CSSTransition } from "react-transition-group";
import { ImageMee, ImgSwitch } from "~/components/layout/ImageMee";
import { useMixPosts } from "~/components/state/PostState";
import { findMee } from "~/data/find/findMee";
import { CreateObjectState } from "~/components/state/CreateState";
import { Linkat, MeeLinks } from "./LinksPage";
import { EmbedBlueskyTimeline } from "~/components/embed/EmbedSNS";
import useSchedule from "~/components/hook/useSchedule";
import {
  compareArray,
  shuffleArray,
} from "~/components/functions/arrayFunction";
import { ScheduleContainer } from "./SchedulePage";
import type { OmittedEnv } from "types/custom-configuration";
import {
  KeyValueEditButton,
  KeyValueRenderProps,
} from "~/components/state/KeyValueDBState";
import { BlueskyFeed } from "~/components/state/ATProtocolState";
import { useLinks } from "~/components/state/LinksState";
import { useEnv } from "~/components/state/EnvState";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";
import { useImageViewer } from "~/components/layout/ImageViewer";

export const Home = React.memo(function Home() {
  return (
    <>
      <HomeImage />
      <div className="topPage wide">
        <ul className="topButtons wide">
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
      </div>
      <div className="topPage article">
        <KeyValueEditButton
          editEnvKey="VITE_KVDB_KEY_TOPPAGE_ARTICLE"
          editType="textarea"
        >
          トップページの記事の編集
        </KeyValueEditButton>
        <KeyValueRenderProps
          editEnvKey="VITE_KVDB_KEY_TOPPAGE_ARTICLE"
          editType="textarea"
        />
      </div>
      <div className="topPage wide">
        <TopLinks />
        <PostsView />
        <div className="info2">
          <ScheduleContainer
            header={
              <h3>
                <Link className="title" to="/schedule" title="スケジュール">
                  <span className="en-title-font" translate="no">
                    Schedule
                  </span>
                </Link>
              </h3>
            }
            defaultView="agenda"
            height={800}
          />
          <BlueskyFeed />
        </div>
      </div>
    </>
  );
});

function TopLinks() {
  const env = useEnv()[0];
  const { links } = useLinks();
  const MeeLinkFlag = useMemo(
    () =>
      !env?.ATPROTO_USE_LINKAT ||
      (links && links.findIndex((link) => link.category === "top") >= 0),
    [links, env],
  );
  return (
    <>
      {MeeLinkFlag ? (
        <MeeLinks category="top" banner className="links" />
      ) : (
        <Linkat hideHeader />
      )}
    </>
  );
}

export const EmbedScriptSNS = React.memo(function EmbedSNS() {
  return (
    <div className="embedSNS">
      <h3 className="title en-title-font color-main" translate="no">
        Bluesky
      </h3>
      <EmbedBlueskyTimeline
        width={700}
        height={800}
        rp={false}
        prof="minimum"
        ui="compact"
        thread={true}
      />
    </div>
  );
});

function PostsView() {
  let posts = useMixPosts();
  posts = useMemo(
    () =>
      findMee(posts || [], {
        where: { draft: { not: true }, time: { lte: new Date() } },
        index: "time",
        direction: "prev",
        take: 3,
      }),
    [posts],
  );
  return (
    <div className="blog">
      <h3>
        <Link className="title" to="/blog" title="ブログ">
          <span className="en-title-font" translate="no">
            Blog
          </span>
        </Link>
      </h3>
      <div className="list">
        {posts.slice(0, 3).map(({ time, title, postId }, i) => {
          const searchParams = new URLSearchParams();
          if (postId) searchParams.set("postId", postId);
          return (
            <Link
              to={{ pathname: "/blog", search: searchParams.toString() }}
              className="article"
              key={`post_article_${postId}`}
            >
              <div className="date">{time?.toLocaleDateString("ja-JP")}</div>
              <div className="title">{title?.slice(0, 32)}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

interface TopImageType {
  topImages: ImageType[];
  topImageIndex: number;
  alwaysImages: ImageType[];
}
interface useTopImageType extends TopImageType {}
const useTopImage = CreateObjectState<useTopImageType>({
  topImages: [],
  topImageIndex: 0,
  alwaysImages: [],
});
export function HomeImageState() {
  const { Set: setTopImage } = useTopImage();
  const { date } = useSchedule({ minute: 0, specify: true });
  const { images } = useImageState();
  const timeframeTag = useMemo(() => getTimeframeTag(date), [date]);
  useEffect(() => {
    if (images && images.length > 0) {
      let topImages = findMee(images, {
        where: {
          OR: [
            { AND: [{ topImage: { gte: 1 } }, { topImage: { lte: 3 } }] },
            {
              album: "main",
              tags: { some: monthlyFilter?.tags },
              topImage: { equals: null },
            },
            {
              album: "main",
              tags: { contains: timeframeTag },
              AND: [{ topImage: { gte: 4 } }, { topImage: { lte: 6 } }],
            },
          ],
        },
        orderBy: [{ topImage: "desc" }],
      });
      setTopImage((state) => {
        const alwaysMap = new Map<string, void>();
        const firstQue = topImages
          .filter(({ topImage }) => topImage === 2 || topImage === 5)
          .sort((a, b) => (a.topImage === 2 && b.topImage !== 2 ? -1 : 0));
        firstQue.forEach((v) => {
          if (v.src) alwaysMap.set(v.src);
        });
        const alwaysImages = topImages.filter(
          ({ topImage }) => topImage === 3 || topImage === 6,
        );
        alwaysImages.forEach((v) => {
          if (v.src) alwaysMap.set(v.src);
        });
        topImages = topImages.filter((v) => v.src && !alwaysMap.has(v.src));
        if (state.topImages.length !== topImages.length + firstQue.length) {
          shuffleArray(topImages);
        }
        topImages = firstQue.concat(topImages);
        return {
          topImages,
          topImageIndex: 0,
          alwaysImages,
        };
      });
    }
  }, [images, timeframeTag, setTopImage]);
  return <></>;
}

export const HomeImage = React.memo(function HomeImage({
  interval = 10000,
}: {
  interval?: number;
}) {
  const nodeRef = useRef<HTMLImageElement>(null);
  const [searchParams] = useSearchParams();
  const { Set: SetImageViewer, image: viewerImage } = useImageViewer();
  const isImageViewerMode = useMemo(() => Boolean(viewerImage), [viewerImage]);
  const {
    alwaysImages,
    topImages: stateTopImages,
    topImageIndex,
    Set,
  } = useTopImage();
  const firstTopImageIndexRef = useRef(topImageIndex);
  const topImages = useMemo(() => {
    return alwaysImages.concat(
      stateTopImages.slice(firstTopImageIndexRef.current),
      stateTopImages.slice(0, firstTopImageIndexRef.current),
    );
  }, [alwaysImages, stateTopImages]);
  const topImageCount = useMemo(() => stateTopImages.length, [stateTopImages]);
  const [current, setCurrent] = useState(0);
  const currentRef = useRef(0);
  const countRef = useRef(0);
  const currentLength = useMemo(() => {
    currentRef.current = current;
    countRef.current =
      (current - alwaysImages.length + firstTopImageIndexRef.current + 1) %
      topImageCount;
    return alwaysImages.length + topImageCount;
  }, [alwaysImages, topImageCount, current]);
  useEffect(() => {
    return () => {
      Set({ topImageIndex: countRef.current });
    };
  }, []);
  useEffect(() => {
    SetImageViewer({ images: topImages, loop: true });
  }, [topImages]);
  const topImage = useMemo(() => topImages[current], [topImages, current]);
  const nextImage = useMemo(
    () => topImages[(current + 1) % topImages.length],
    [topImages, current],
  );
  const previousImage = useMemo(
    () => topImages[(topImages.length + current - 1) % topImages.length],
    [topImages, current],
  );
  const [intervalSwitch, setIntervalSwitch] = useState(false);
  const Next = useCallback(
    (auto?: boolean) => {
      setCurrent((v) => (v + 1) % currentLength);
      if (!auto) setIntervalSwitch((v) => !v);
    },
    [currentLength],
  );
  const Previous = useCallback(() => {
    setCurrent((v) => (currentLength + v - 1) % currentLength);
    setIntervalSwitch((v) => !v);
  }, [currentLength]);
  useEffect(() => {
    if (topImages.length > 0 && !isImageViewerMode) {
      const timer = setInterval(() => {
        Next(true);
      }, interval);
      return () => {
        if (timer) clearInterval(timer);
      };
    }
  }, [interval, topImages, isImageViewerMode, intervalSwitch]);
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
      state: { keep: true, from: location.pathname },
      preventScrollReset: true,
      title: topImage.title || undefined,
    };
  }, [topImage, searchParams]);
  useEffect(() => {
    if (viewerImage) {
      const index = topImages.findIndex((v) => v.key === viewerImage.key);
      if (currentRef.current !== index) {
        setCurrent(index);
      }
    }
  }, [viewerImage]);
  const [isExiting, setIsExiting] = useState(false);
  const Gage = useCallback(
    () => (
      <div
        className={isImageViewerMode ? "" : "gage"}
        style={{
          animationDuration: interval + "ms",
        }}
      />
    ),
    [topImage, isImageViewerMode],
  );
  return (
    <div className="HomeImage wide translucent-buttons">
      <div className="middle">
        <button
          type="button"
          className="hover-visible previous"
          title={previousImage?.title || "previous"}
          onClick={() => Previous()}
          disabled={isExiting}
        >
          <MdChevronLeft />
        </button>
        <button
          type="button"
          className="hover-visible next"
          title={nextImage?.title || "next"}
          onClick={() => Next()}
          disabled={isExiting}
        >
          <MdChevronRight />
        </button>
      </div>
      {topImage ? (
        <TransitionGroup className="wrapper">
          <CSSTransition
            nodeRef={nodeRef}
            key={topImage.src || ""}
            timeout={750}
            onExit={() => {
              setIsExiting(true);
            }}
            onExited={() => {
              setIsExiting(false);
            }}
          >
            <Link className="item" {...toStatehandler()}>
              <ImageMee
                ref={nodeRef}
                imageItem={topImage}
                loading="eager"
                className="image"
                isCover
              />
            </Link>
          </CSSTransition>
          <Gage />
        </TransitionGroup>
      ) : (
        <div className="dummy" />
      )}
    </div>
  );
});
