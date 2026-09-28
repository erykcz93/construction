/**
 * Aldervane — animations.js
 * --------------------------------------------------------------------------
 * Reveal-on-scroll for elements marked with data-reveal.
 *   - Uses IntersectionObserver (no scroll listeners, no libraries).
 *   - Elements already visible when the page loads are never hidden,
 *     so there is no flash of content and no layout shift.
 *   - Does nothing for visitors who prefer reduced motion, or when
 *     IntersectionObserver is unavailable: all content simply stays visible.
 * Styles live in assets/css/animations.css.
 */
(function () {
    "use strict";

    const elements = Array.from(document.querySelectorAll("[data-reveal]"));
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!elements.length || prefersReducedMotion || !("IntersectionObserver" in window)) {
        return;
    }

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            }
        });
    }, {
        rootMargin: "0px 0px -8% 0px",
        threshold: 0.1
    });

    const revealLine = window.innerHeight * 0.92;

    elements.forEach(function (element) {
        if (element.getBoundingClientRect().top < revealLine) {
            return;
        }

        // Stagger siblings slightly (delay classes are defined in animations.css).
        const siblings = Array.from(element.parentElement.children).filter(function (child) {
            return child.hasAttribute("data-reveal");
        });
        const position = siblings.indexOf(element) % 4;

        element.classList.add("reveal");

        if (position > 0) {
            element.classList.add("reveal--delay-" + position);
        }

        observer.observe(element);
    });
})();
