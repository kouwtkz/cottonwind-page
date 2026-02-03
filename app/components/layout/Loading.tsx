import React from "react";
import { SimpleSlider } from "../SimpleSlider";
import { useIsLoadedFloat } from "../state/SetState";

export const Loading = React.memo(function Loading() {
  const value = useIsLoadedFloat()[0]!;
  return (
    <div className="loadingWindow">
      <span className="loadingNow">よみこみちゅう…</span>
      <img
        src="/static/images/gif/わたかぜくんカーソル_待機.gif"
        alt="読み込み中の画像"
        className="pixel"
      />
      <SimpleSlider value={value} max={1} />
      <noscript>
        <p>Javascriptが無効のようです</p>
        <p>有効にすることで見れるようになります🐏</p>
      </noscript>
    </div>
  );
});
