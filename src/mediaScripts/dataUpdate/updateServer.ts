import { createServer, ServerResponse, IncomingMessage } from 'http'
import { DataUpdate } from './updateFunction';
import { Plugin, ViteDevServer } from 'vite';

interface dataUpdateServerPluginsProps {
  path?: string;
}

export function dataUpdateServerPlugins({ path = process.env.MEDIA_UPDATE_URL_PATH ?? "" }: dataUpdateServerPluginsProps = {}) {
  return {
    name: "dataUpdateServer", async configureServer(server) {
      async function createMiddleware(s: ViteDevServer) {
        return async function (req: IncomingMessage, res: ServerResponse, next: Function) {
          if (req.method === "POST" && req.url?.startsWith(path)) {
            req.on("data", (chunk) => {
              DataUpdate(String(chunk));
            });
            res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('');
          } else next();
        };
      }
      server.middlewares.use(await createMiddleware(server));
    },
  } as Plugin
}

export function dataUpdateServer(port = 5073) {
  const s = createServer(function (req, res) {
    DataUpdate((req.url ?? "").split("/")[1]);
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('');
  });
  s.listen(port);
}
