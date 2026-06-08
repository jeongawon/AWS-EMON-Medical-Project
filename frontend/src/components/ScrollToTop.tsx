import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * 라우트 전환 시 항상 화면 최상단으로 스크롤.
 * 단, `#section` 해시가 있으면 해당 앵커로 스크롤 (예: /technology#aws).
 *
 * App.tsx 의 <BrowserRouter> 아래, <Routes> 위에 한 번만 두면 모든 페이지에 적용.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView({ behavior: "auto", block: "start" });
        return;
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, hash]);

  return null;
}
