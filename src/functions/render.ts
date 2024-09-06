import { ReactNode } from "react";
import { renderToString, ServerOptions } from "react-dom/server";

export function renderHtml(element: ReactNode, options?: ServerOptions) {
  return "<!DOCTYPE html>" + renderToString(element, options)
}