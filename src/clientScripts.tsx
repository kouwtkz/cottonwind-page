const scripts: { [k in jsFileNames]: string } = {
  jszip: "/static/scripts/jszip.min.js",
  epub: "/static/scripts/epub.min.js",
  highlight: "/static/scripts/highlight.min.js",
};

export function DefaultImportScripts({
  names = "all",
}: {
  names?: jsFileNamesArgs | jsFileNames[];
}) {
  const list =
    names === "all"
      ? Object.entries(scripts)
      : Array.isArray(names)
      ? names.map((k) => [k, scripts[k]])
      : [[names, scripts[names]]];
  return (
    <>
      {list.map(([k, v]) => (
        <script src={v} key={k} />
      ))}
    </>
  );
}

export function DOMContentLoaded(call: Function) {
  if (document.readyState !== "loading") {
    call();
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      call();
    });
  }
}
