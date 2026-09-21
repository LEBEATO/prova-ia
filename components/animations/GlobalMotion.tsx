"use client";

import { useEffect } from "react";

const REVEAL_SELECTOR = [
  "main > header",
  "main > section",
  "main article",
  "main aside",
  "main .grid > *",
  "main form > div",
  "main table",
  "main footer",
].join(",");

export default function GlobalMotion() {
  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const prepareElements = () => {
      const elements = Array.from(
        document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR)
      );

      elements.forEach((element, index) => {
        if (element.dataset.motionReady === "true") return;

        element.dataset.motionReady = "true";
        element.classList.add("motion-reveal");
        element.style.setProperty(
          "--motion-delay",
          `${Math.min(index % 6, 5) * 55}ms`
        );

        if (reduceMotion) {
          element.classList.add("motion-visible");
        }
      });

      return elements;
    };

    const elements = prepareElements();

    if (reduceMotion) return;

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

    elements.forEach((element) => observer.observe(element));

    const mutationObserver = new MutationObserver(() => {
      prepareElements().forEach((element) => {
        if (!element.classList.contains("motion-visible")) {
          observer.observe(element);
        }
      });
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
