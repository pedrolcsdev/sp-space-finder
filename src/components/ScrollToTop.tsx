import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const location = useLocation();

  useLayoutEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [location.key, location.pathname, location.search]);

  return null;
};

export default ScrollToTop;
