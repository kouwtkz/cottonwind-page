import { useEnv } from "@/state/EnvState";
import { EmbedScript } from "./EmbedScript";
import { useDarkMode } from "@/state/StateSet";

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
          style={{ height }}
          data-width={width}
          data-height={height}
          data-lang="ja"
          data-pin="0"
        />
      ) : null}
    </>
  );
}
