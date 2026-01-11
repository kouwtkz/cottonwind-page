import { useEnv } from "~/components/state/EnvState";
import { EmbedScript } from "./EmbedScript";
import { useDarkMode } from "~/components/theme/Theme";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_LANG } from "~/Env";

export function EmbedBlueskyTimeline({
  width = 420,
  height = 500,
  lang = DEFAULT_LANG,
  q,
  id,
  pin = false,
  theme,
  ui = 0,
  prof = 0,
  rp = true,
  thread = false,
}: EmbedBlueskyProps) {
  const handle = useEnv()[0]?.BLUESKY_HANDLE;
  const isDark = useDarkMode()[0];
  const dataTheme = useMemo(() => {
    if (typeof theme === "undefined") return isDark ? "dark" : "light";
    else return theme;
  }, [theme, isDark]);
  const dataPin = useMemo(() => (pin ? 1 : 0), [pin]);
  const dataUI = useMemo(() => {
    if (typeof ui === "number") return ui;
    else if (ui === "default") return 0;
    else if (ui === "compact") return 1;
    else return 2;
  }, [ui]);
  const dataProf = useMemo(() => {
    if (typeof prof === "number") return prof;
    else if (prof === "hide") return 0;
    else if (prof === "default") return 1;
    else return 2;
  }, [prof]);
  const dataRepost = useMemo(() => (rp ? 0 : 1), [rp]);
  const dataThread = useMemo(() => (thread ? 1 : 0), [thread]);
  const refIFrame = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    if (refIFrame.current) {
      const iframe = refIFrame.current;
      const Url = new URL(iframe.src);
      Url.searchParams.set("theme", dataTheme);
      Url.searchParams.set("pin", String(dataPin));
      Url.searchParams.set("q", q || "");
      Url.searchParams.set("rp", String(dataRepost));
      Url.searchParams.set("thread", String(dataThread));
      Url.searchParams.set("ui", String(dataUI));
      Url.searchParams.set("prof", String(dataProf));
      iframe.src = Url.href;
    }
  }, [dataTheme, dataPin, q, dataUI, dataProf, dataRepost, dataThread]);
  return (
    <>
      {handle ? (
        <EmbedScript
          async
          src="https://bst.heion.net/timeline.js"
          data-handle={handle}
          style={{ width, height }}
          data-theme={dataTheme}
          data-width={width}
          data-height={height}
          data-lang={lang}
          data-pin={dataPin}
          data-ui={dataUI}
          data-prof={dataProf}
          data-rp={dataRepost}
          data-thread={dataThread}
          {...(q ? { "data-q": q } : {})}
          {...(id ? { "data-id": id } : {})}
          refIFrame={refIFrame}
        />
      ) : null}
    </>
  );
}

export function EmbedTwitter({ width = 420, height = 500 }: EmbedSNSprops) {
  const [embedTwitterCache, setEmbedTwitterCache] = useState<
    HTMLElement[] | null
  >();
  useEffect(() => {
    setEmbedTwitterCache(window.EmbedTwitterCaches || null);
  }, [setEmbedTwitterCache]);
  const ref = React.useCallback(
    (node: HTMLDivElement | null) => {
      if (node) {
        if (embedTwitterCache) {
          embedTwitterCache.forEach((elm) => {
            node.appendChild(elm);
          });
        } else {
          const observer = new MutationObserver((callback) => {
            callback.some(({ removedNodes }) => {
              if (Array.from(removedNodes).some((n) => n.nodeName === "A")) {
                window.EmbedTwitterCaches = Array.from(
                  node.children
                ) as HTMLElement[];
                observer.disconnect();
              }
            });
          });
          observer.observe(node, {
            childList: true,
          });
        }
      }
    },
    [embedTwitterCache]
  );
  const handle = useEnv()[0]?.TWITTER_HANDLE;
  const isDark = useDarkMode()[0];
  return (
    <>
      {handle ? (
        <div style={{ width, height }} ref={ref}>
          {embedTwitterCache === null ? (
            <>
              <a
                className="twitter-timeline"
                data-width={width}
                data-height={height}
                data-theme={isDark ? "dark" : "light"}
                href={`https://twitter.com/${handle}?ref_src=twsrc%5Etfw`}
              >
                Tweets by {handle}
              </a>
              <EmbedScript
                async
                src="https://platform.twitter.com/widgets.js"
                charset="utf-8"
              />
            </>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
