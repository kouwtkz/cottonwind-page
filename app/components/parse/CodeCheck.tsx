import { useEffect, useMemo, useRef } from "react";
import { useLocation } from "react-router";

interface codeToHighlightProps {
  selector?: string;
  force?: boolean;
}
export function codeToHighlight({
  selector = "code:not([parsed])",
  force,
}: codeToHighlightProps = {}) {
  (document.querySelectorAll(selector) as NodeListOf<HTMLElement>).forEach(
    (el) => {
      if (force) {
        delete el.dataset.highlighted;
      }
      if (!el.dataset.highlighted) hljs.highlightElement(el);
    }
  );
}

export function Code(
  props: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    hljs.highlightElement(ref.current!);
  }, [props]);
  return <code {...props} ref={ref} />;
}

export function WhenRootCodeToHighlight() {
  const location = useLocation();
  useEffect(() => {
    codeToHighlight();
  }, [location]);
  return <></>;
}
