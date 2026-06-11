"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export const PROFILE_ROUTE_REFRESH = "coffeemania-profile-route-refresh";

function emitProfileRouteRefresh() {
  window.dispatchEvent(new CustomEvent(PROFILE_ROUTE_REFRESH));
}

export default function ProfileRouteRefresh() {
  const pathname = usePathname();
  const prevPathname = useRef(pathname);

  useEffect(() => {
    if (pathname === "/profile" && prevPathname.current !== "/profile") {
      queueMicrotask(emitProfileRouteRefresh);
    }
    prevPathname.current = pathname;
  }, [pathname]);

  useEffect(() => {
    const onPopState = () => {
      queueMicrotask(() => {
        if (window.location.pathname === "/profile") {
          emitProfileRouteRefresh();
        }
      });
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  return null;
}
