/* Tilbe Kurban — Service Worker push event handler */
/* next-pwa otomatik sw.js'ye importScripts ile dahil edilir */

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let veri;
  try {
    veri = event.data.json();
  } catch {
    veri = { baslik: "Tilbe Kurban", govde: event.data.text() };
  }

  const baslik = veri.baslik || "Tilbe Kurban";
  const secenekler = {
    body: veri.govde || veri.mesaj || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-96.png",
    image: veri.gorsel,
    tag: veri.etiket || "tilbe-bildirim",
    data: {
      url: veri.url || "/",
      bildirimId: veri.bildirimId,
    },
    vibrate: [200, 100, 200],
    requireInteraction: veri.onemli === true,
    actions: veri.eylemler || [],
  };

  event.waitUntil(self.registration.showNotification(baslik, secenekler));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const hedefUrl = event.notification.data && event.notification.data.url
    ? event.notification.data.url
    : "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Açık tab varsa odakla
        for (const client of clientList) {
          if (client.url.includes(hedefUrl) && "focus" in client) {
            return client.focus();
          }
        }
        // Yoksa yeni tab aç
        if (self.clients.openWindow) {
          return self.clients.openWindow(hedefUrl);
        }
        return null;
      }),
  );
});
