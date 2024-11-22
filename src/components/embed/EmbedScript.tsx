import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

interface EmbedScriptProps
  extends React.ScriptHTMLAttributes<HTMLScriptElement> {
  charset?: string;
}

export const EmbedScript = forwardRef<HTMLDivElement, EmbedScriptProps>(
  function EmbedScript({ src, style, ...args }, forwardedRef) {
    const ref = useRef<HTMLDivElement>(null);
    useImperativeHandle(forwardedRef, () => ref.current!);
    useEffect(() => {
      const div = ref.current!;
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
    return <div ref={ref} style={style} />;
  }
);
