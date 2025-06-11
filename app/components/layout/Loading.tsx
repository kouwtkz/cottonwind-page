import { SimpleSlider } from "../SimpleSlider";
import { useIsLoaded } from "../state/SetState";

export function Loading() {
  const list = useIsLoaded()[0]!;
  return (
    <div className="loadingWindow">
      <span className="loadingNow">よみこみちゅう…</span>
      <img
        src="/static/images/gif/わたかぜくんカーソル_待機.gif"
        alt="読み込み中の画像"
        className="pixel"
      />
      <SimpleSlider
        value={list.reduce((a, c) => (c ? a + 1 : a), 0)}
        max={list.length}
      />
      <noscript>
        <p>Javascriptが無効のようです</p>
        <p>有効にすることで見れるようになります🐏</p>
      </noscript>
    </div>
  );
}
