/**
 * Meldet den Service Worker an (nur im Build). Ein Update wird erst übernommen,
 * wenn gerade keine Liste offen ist oder die App im Hintergrund liegt, damit beim
 * Abhaken nichts neu lädt. Alle Daten liegen ohnehin in localStorage.
 */
export function registerServiceWorker(hasList: () => boolean): void {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
  const sw = navigator.serviceWorker;
  const hadController = !!sw.controller;
  const quiet = () => !hasList() || document.visibilityState === "hidden";

  let reloaded = false;
  sw.addEventListener("controllerchange", () => {
    if (!hadController || reloaded) return;
    reloaded = true;
    location.reload();
  });

  window.addEventListener("load", () => {
    sw.register("./sw.js", { scope: "./" })
      .then((reg) => {
        const tryActivate = () => {
          if (reg.waiting && sw.controller && quiet()) reg.waiting.postMessage("skipWaiting");
        };
        tryActivate();
        reg.addEventListener("updatefound", () => {
          reg.installing?.addEventListener("statechange", tryActivate);
        });
        document.addEventListener("visibilitychange", () => {
          tryActivate();
          // Beim Zurückkehren nach neuer Version sehen (nur mit Netz).
          if (document.visibilityState === "visible" && navigator.onLine) void reg.update().catch(() => undefined);
        });
      })
      .catch((err) => console.error("Service Worker", err));
  });
}
