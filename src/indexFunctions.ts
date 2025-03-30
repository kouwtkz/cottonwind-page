import { CompactCode } from "@/functions/doc/StrFunctions";
import { CommonHono } from "@/types/HonoCustomType";

interface appFromImportStyleProps<T> {
  styles: [string, unknown][];
  app: CommonHono<T>;
  dir?: string;
}
export function appFromImportStyle<T>({ styles, app, dir = "/css" }: appFromImportStyleProps<T>) {
  const stylePathes: string[] = [];
  for (const [name, code] of styles) {
    const path = `${dir}/${name}.css`;
    stylePathes.push(path);
    const compactStyles = CompactCode(code);
    app.get(path, (c) =>
      c.body(compactStyles, { headers: { "Content-Type": "text/css" } })
    );
  }
  return stylePathes;
}
