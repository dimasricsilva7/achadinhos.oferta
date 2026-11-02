"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const PING_MS = 25_000;

function id(key: string, store: Storage): string {
  let v = store.getItem(key);
  if (!v) {
    v = (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`);
    store.setItem(key, v);
  }
  return v;
}

/** Heartbeat anônimo do "Online ao vivo" (admin). Não roda no /admin. */
export function Pinger() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;

    const visitorId = id("vid", localStorage);
    const sessionId = id("sid", sessionStorage);

    const ping = () => {
      fetch("/api/track/ping", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId, visitorId, path: pathname, referrer: document.referrer || undefined }),
        keepalive: true,
      }).catch(() => {});
    };

    ping();
    const t = setInterval(ping, PING_MS);
    return () => clearInterval(t);
  }, [pathname]);

  return null;
}
