import React, { useEffect, useImperativeHandle, useRef } from "react";

interface EmbedScriptProps
  extends React.ScriptHTMLAttributes<HTMLScriptElement> {
  ref?: React.RefObject<HTMLDivElement>;
  charset?: string;
}

export function EmbedScript({ src, style, ref, ...args }: EmbedScriptProps) {
  const inRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => inRef.current!);
  useEffect(() => {
    const div = inRef.current!;
    const script1 = document.createElement("script");
    if (src) {
      for (const child of div.children) {
        div.removeChild(child);
      }
      script1.src = src;
      Object.entries(args).forEach(([k, v]) => {
        if (k.startsWith("on")) {
          script1.addEventListener(k.slice(2).toLocaleLowerCase(), v);
        } else {
          script1.setAttribute(k, v);
        }
      });
      div.appendChild(script1);
    }
    return () => {
      div.removeChild(script1);
    };
  }, [src, args]);
  return <div ref={inRef} style={style} />;
}
