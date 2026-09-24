"use client";

import { useEffect } from "react";

const SELECTORS = {
  text: "main h1, main h2, main h3, main p",
  cards:
    "main article, main aside, main section > div > div, main .grid > *, main form > div",
  actions: "main a, main button",
  tables: "main table",
};

export default function GlobalMotion() {
  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add("motion-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.08,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    const prepare = () => {
      const groups: Array<[string, string]> = [
        [SELECTORS.text, "motion-text"],
        [SELECTORS.cards, "motion-card"],
        [SELECTORS.actions, "motion-action"],
        [SELECTORS.tables, "motion-table"],
      ];

      groups.forEach(([selector, className]) => {
        const elements = Array.from(
          document.querySelectorAll<HTMLElement>(selector)
        );

        elements.forEach((element, index) => {
          if (element.dataset.motionType) return;

          element.dataset.motionType = className;
          element.classList.add("motion-reveal", className);
          element.style.setProperty(
            "--motion-delay",
            `${Math.min(index % 5, 4) * 70}ms`
          );

          const rect = element.getBoundingClientRect();
          const isInitiallyVisible =
            rect.bottom >= 0 &&
            rect.top <= window.innerHeight &&
            rect.right >= 0 &&
            rect.left <= window.innerWidth;

          if (reduceMotion || isInitiallyVisible) {
            element.classList.add("motion-visible");
          } else {
            observer.observe(element);
          }
        });
      });
    };

    prepare();

    const mutationObserver = new MutationObserver(() => {
      prepare();
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  return null;
}
