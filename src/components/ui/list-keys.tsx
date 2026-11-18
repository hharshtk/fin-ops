"use client";

import { useEffect } from "react";

function typing(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
  );
}

/**
 * Keyboard layer for list screens: j / k (or arrow keys while a row has focus) move the selection,
 * Esc closes the inspector, "/" focuses the list search. Rows are plain links rendered on the
 * server; this component only moves focus and clicks them.
 */
export function ListKeys() {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (document.querySelector("dialog[open]")) return;
      const inField = typing(e.target);

      if (e.key === "Escape" && !inField) {
        const close = [
          ...document.querySelectorAll<HTMLAnchorElement>(
            "[data-inspector-close]",
          ),
        ].find((a) => a.offsetParent !== null);
        if (close) {
          e.preventDefault();
          close.click();
        }
        return;
      }

      if (e.key === "/" && !inField) {
        const search =
          document.querySelector<HTMLInputElement>("[data-list-search]");
        if (search) {
          e.preventDefault();
          search.focus();
          search.select();
        }
        return;
      }

      const onRow =
        e.target instanceof HTMLElement &&
        e.target.hasAttribute("data-row-link");
      const down = e.key === "j" || (onRow && e.key === "ArrowDown");
      const up = e.key === "k" || (onRow && e.key === "ArrowUp");
      if ((!down && !up) || (inField && !onRow)) return;

      const links = [
        ...document.querySelectorAll<HTMLAnchorElement>("[data-row-link]"),
      ].filter((a) => a.offsetParent !== null);
      if (links.length === 0) return;
      e.preventDefault();
      const active = document.activeElement as HTMLElement | null;
      let index = links.findIndex((a) => a === active);
      if (index === -1)
        index = links.findIndex(
          (a) => a.getAttribute("aria-current") === "true",
        );
      const next =
        links[Math.min(Math.max(index + (down ? 1 : -1), 0), links.length - 1)];
      if (!next || next === active) return;
      next.focus();
      next.scrollIntoView({ block: "nearest" });
      next.click();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return null;
}
