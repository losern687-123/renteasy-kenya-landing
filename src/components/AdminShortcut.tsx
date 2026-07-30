import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Discreet admin entry point.
 * Press Ctrl+Shift+A (or Cmd+Shift+A) anywhere on the landing page to open
 * the admin portal. Credentials are still required at /admin/login.
 */
export const AdminShortcut = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        navigate("/admin/login");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  return null;
};
