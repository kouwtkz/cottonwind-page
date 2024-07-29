export function Loading() {
  return (
    <div className="loadingWindow">
      <span className="loadingNow">よみこみちゅう…</span>
      <img
        src="/static/images/gif/わたかぜくんカーソル_待機.gif"
        alt="読み込み中の画像"
        className="pixel"
      />
      <noscript>
        <p>Javascriptが無効のようです</p>
        <p>有効にすることで見れるようになります🐏</p>
      </noscript>
    </div>
  );
}
