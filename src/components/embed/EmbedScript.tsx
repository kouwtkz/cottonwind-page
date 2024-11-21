import React, { useEffect, useRef } from "react";

interface EmbedScriptProps
  extends React.ScriptHTMLAttributes<HTMLScriptElement> {}

export function EmbedScript({ src, style, ...args }: EmbedScriptProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const div = ref.current!;
    const script1 = document.createElement("script");
    if (src) {
      for (const child of div.children) {
        div.removeChild(child);
      }
      script1.src = src;
      Object.entries(args).forEach(([k, v]) => {
        script1.setAttribute(k, v);
      });
      div.appendChild(script1);
    }
    return () => {
      div.removeChild(script1);
    };
  }, [src, args]);
  return <div ref={ref} style={style} />;
}
