import { useEnv } from "@/state/EnvState";
import { EmbedScript } from "./EmbedScript";
import { useDarkMode } from "@/state/StateSet";
import React, { useEffect, useState } from "react";

interface EmbedSNSprops {
  width?: number;
  height?: number;
}
export function EmbedBluesky({ width = 420, height = 500 }: EmbedSNSprops) {
  const handle = useEnv()[0]?.BLUESKY_HANDLE;
  const isDark = useDarkMode()[0];
  return (
    <>
      {handle ? (
        <EmbedScript
          async
          src="https://bst.heion.net/timeline.js"
          data-handle={handle}
          data-theme={isDark ? "dark" : "light"}
          style={{ width, height }}
          data-width={width}
          data-height={height}
          data-lang="ja"
          data-pin="0"
        />
      ) : null}
    </>
  );
}

export function EmbedTwitter({ width = 420, height = 500 }: EmbedSNSprops) {
  const [embedTwitterCache, setEmbedTwitterCache] =
    useState<HTMLElement | null>();
  useEffect(() => {
    setEmbedTwitterCache(window.EmbedTwitterCache || null);
  }, [setEmbedTwitterCache]);
  const ref = React.useCallback(
    (node: HTMLDivElement | null) => {
      if (node) {
        if (embedTwitterCache) {
          node.appendChild(embedTwitterCache);
        } else {
          const observer = new MutationObserver((callback) => {
            callback.some(({ removedNodes }) => {
              if (Array.from(removedNodes).some((n) => n.nodeName === "A")) {
                window.EmbedTwitterCache = node as HTMLElement;
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
