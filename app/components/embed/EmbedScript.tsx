import React, { useEffect, useImperativeHandle, useRef, useState } from "react";

interface EmbedScriptProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "onLoad"> {
  ref?: React.Ref<HTMLDivElement>;
  refIFrame?: React.Ref<HTMLIFrameElement>;
  onLoad?(e: HTMLIFrameElement): void;
  charset?: string;
  src?: string;
  async?: boolean;
}

export function EmbedScript({
  src,
  style,
  ref,
  refIFrame,
  onLoad,
  async: isAsync,
  ...args
}: EmbedScriptProps) {
  const inRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => inRef.current!);
  const scriptRef = useRef<HTMLScriptElement>(null);
  const [IFrame, setIFrame] = useState<HTMLIFrameElement | null>(null);
  useImperativeHandle(refIFrame, () => IFrame!, [IFrame]);
  useEffect(() => {
    if (src) {
      if (scriptRef.current === null) {
        const div = inRef.current!;
        const script1 = document.createElement("script");
        scriptRef.current = script1;
        for (const child of div.children) {
          div.removeChild(child);
        }
        script1.src = src;
        if (typeof isAsync === "boolean") script1.async = isAsync;
        Object.entries(args).forEach(([k, v]) => {
          if (k.startsWith("on")) {
            script1.addEventListener(k.slice(2).toLocaleLowerCase(), v);
          } else {
            script1.setAttribute(k, v);
          }
        });
        div.appendChild(script1);
        const observer = new MutationObserver((callback) => {
          if (
            callback.some(({ addedNodes }) => {
              const iframeElement = Array.from(addedNodes).find(
                (node) => node.nodeName === "IFRAME"
              ) as HTMLIFrameElement | null;
              if (iframeElement) {
                setIFrame(iframeElement);
                if (onLoad) onLoad(iframeElement);
              }
              return true;
            })
          ) {
            observer.disconnect();
          }
        });
        observer.observe(div, {
          childList: true,
        });
      }
    }
  }, [src, args, isAsync, onLoad]);
  return <div ref={inRef} style={style} {...args} />;
}
