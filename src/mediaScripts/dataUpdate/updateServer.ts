import { createServer } from 'http'
import { DataUpdate } from './updateFunction';

export function dataUpdateServer(port = 5073) {
  const s = createServer(function (req, res) {
    DataUpdate((req.url ?? "").split("/")[1]);
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('');
  });
  s.listen(port);
}
