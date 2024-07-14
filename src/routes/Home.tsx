import { Link, useNavigate } from "react-router-dom";
import { useImageState } from "../state/ImageState";
import { filterPickFixed } from "../data/functions/FilterImages";
import { useEffect, useMemo, useRef, useState } from "react";
import { TransitionGroup, CSSTransition } from "react-transition-group";
import { ImageMee, ImgSwitch } from "../components/layout/ImageMee";
import { NoteView } from "@/state/FeedState";

export default function Home() {
  return (
    <>
      <HomeImage />
      <div className="topPage wide">
        <ul>
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
        <TopPageBannerLink />
        <NoteView />
      </div>
    </>
  );
}

export function TopPageBannerLink() {
  return (
    <>
      <ul>
        <li>
          <a
            href="https://cottonwind.booth.pm/"
            target="_blank"
            title="わたかぜや (BOOTH)"
            rel="noopener"
            className="overlay"
          >
            <img
              src="/static/images/webp/cottonwind_booth_300_100.webp"
              alt="BOOTH"
            />
          </a>
        </li>
      </ul>
    </>
  );
}

export function HomeImage() {
  const { imageAlbumList } = useImageState();
  const images = useMemo(
    () => imageAlbumList.find(({ name }) => name === "art")?.list ?? [],
    [imageAlbumList]
  );
  const topImages = filterPickFixed({
    images,
    name: "topImage",
  });
  const [topImageState, setTopImage] = useState<MediaImageItemType>();
  const firstLoad = useRef(true);
  const currentTopImage = useRef<MediaImageItemType | null>(null);
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
  if (firstLoad.current && images.length > 0) {
    setRndTopImage();
    firstLoad.current = false;
  }
  useEffect(() => {
    const timer = setInterval(() => {
      setRndTopImage();
    }, 10000);
    return () => clearInterval(timer);
  });

  return (
    <div className="HomeImage wide">
      {currentTopImage.current && topImage ? (
        <TransitionGroup className="wrapper">
          <CSSTransition key={currentTopImage.current.src || ""} timeout={750}>
            <ImageMee imageItem={topImage} loading="eager" className="image" />
          </CSSTransition>
        </TransitionGroup>
      ) : (
        <div className="dummy" />
      )}
    </div>
  );
}
