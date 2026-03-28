const isLocalhost =
  window.location.hostname === "localhost" ||
  window.location.hostname === "[::1]" ||
  /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/.test(window.location.hostname);

export function register() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    const swUrl = "/service-worker.js";

    if (isLocalhost) {
      checkValidServiceWorker(swUrl);
      return;
    }

    registerValidSW(swUrl);
  });
}

function registerValidSW(swUrl) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (!installingWorker) {
          return;
        }

        installingWorker.onstatechange = () => {
          if (installingWorker.state !== "installed") {
            return;
          }

          if (navigator.serviceWorker.controller) {
            // A new version is available and will activate after closing tabs.
            console.info("New content is available; close all tabs to update.");
            return;
          }

          console.info("Content is cached for offline use.");
        };
      };
    })
    .catch((error) => {
      console.error("Service worker registration failed:", error);
    });
}

function checkValidServiceWorker(swUrl) {
  fetch(swUrl, {
    headers: {
      "Service-Worker": "script"
    }
  })
    .then((response) => {
      const contentType = response.headers.get("content-type");
      if (response.status === 404 || (contentType && !contentType.includes("javascript"))) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
        return;
      }

      registerValidSW(swUrl);
    })
    .catch(() => {
      console.info("No internet connection found. App is running in offline mode.");
    });
}

export function unregister() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  navigator.serviceWorker.ready
    .then((registration) => {
      registration.unregister();
    })
    .catch((error) => {
      console.error(error.message);
    });
}
