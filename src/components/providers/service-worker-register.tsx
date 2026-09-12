"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Instalação como PWA continua opcional; falha de registro não deve quebrar o app.
    });
  }, []);

  return null;
}
