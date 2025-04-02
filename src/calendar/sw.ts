type ID = string;
interface FetchEvent extends Event {
  readonly clientId: ID;
  readonly preloadResponse?: Response;
  readonly replacesClientId: ID;
  readonly resultingClientId: ID;
  readonly request: Request;
  respondWith(response: Promise<Response>): void;
  waitUntil(promise: Promise<unknown>): void;
}

self.addEventListener('fetch', function (e) {
  const event = e as FetchEvent;
  // console.log(event);
})

function FetchCache(event: FetchEvent) {
  event.respondWith(
    (async () => {
      // // キャッシュからレスポンスを取得しようとします。
      const cachedResponse = await caches.match(event.request);
      // // 見つかったらそれを返します。
      if (cachedResponse) return cachedResponse;
      // キャッシュ内に一致するものが見つからなかった場合は、ネットワークを使用します。
      return fetch(event.request);
    })(),
  );
}
