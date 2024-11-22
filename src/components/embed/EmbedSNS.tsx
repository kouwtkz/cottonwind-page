import { useEnv } from "@/state/EnvState";
import { EmbedScript } from "./EmbedScript";
import { useDarkMode } from "@/state/StateSet";
import React, { useEffect, useMemo, useRef } from "react";

interface EmbedSNSprops {
  width?: number;
  height?: number;
}
export function EmbedBluesky({ width = 420, height = 560 }: EmbedSNSprops) {
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

let EmbedTwitterCache: HTMLElement | null = null;
export function EmbedTwitter({ width = 420, height = 560 }: EmbedSNSprops) {
  const ref = React.useCallback((node: HTMLDivElement | null) => {
    if (EmbedTwitterCache) {
      console.log(node);
      node?.appendChild(EmbedTwitterCache);
    } else if (node) {
      const observer = new MutationObserver((callback) => {
        if (
          callback.some(({ removedNodes }) => {
            if (Array.from(removedNodes).some((n) => n.nodeName === "A")) {
              EmbedTwitterCache = node.firstChild as HTMLElement;
              return true;
            }
          })
        ) {
          observer?.disconnect();
        }
      });
      try {
        observer.observe(node, {
          childList: true,
        });
        return () => {
          observer.disconnect();
        };
      } catch {}
    }
  }, []);
  const handle = useEnv()[0]?.TWITTER_HANDLE;
  const isDark = useDarkMode()[0];
  return (
    <>
      {handle ? (
        <div style={{ width, height }} ref={ref}>
          {EmbedTwitterCache ? null : (
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
          )}
        </div>
      ) : null}
    </>
  );
}
