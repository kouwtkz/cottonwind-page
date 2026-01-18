import React from "react";

const scripts = {
  jszip: "/static/scripts/jszip.min.js",
  epub: "/static/scripts/epub.min.js",
  highlight: "/static/scripts/highlight.min.js",
  laymic: "/static/scripts/laymic.iife.min.js",
};
type jsFileNames = keyof typeof scripts;
type jsFileNamesArgs = "all" | jsFileNames;

export const DefaultImportScripts = React.memo(function DefaultImportScripts({
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
});

export function DOMContentLoaded(call: Function) {
  if (document.readyState !== "loading") {
    call();
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      call();
    });
  }
}
