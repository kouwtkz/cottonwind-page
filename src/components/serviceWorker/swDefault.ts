namespace SW {
  declare const self: ServiceWorkerGlobalScope;

  // self.registration.update()
  self.addEventListener('fetch', function (e) {
    const event = e as FetchEvent;
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
}
