/**
 * Aldervane — counters.js
 * --------------------------------------------------------------------------
 * Animated number counters for statistics.
 *
 * Markup: <span data-counter="640">640</span>
 *         <span data-counter="2.4" data-decimals="1">2.4</span>
 *
 * The final value is written in the HTML, so it is always correct without
 * JavaScript, for search engines and for reduced-motion users.
 * While a counter animates, screen readers get the final value from a
 * visually hidden copy and the changing digits are hidden from them.
 */
(function () {
    "use strict";

    const counters = Array.from(document.querySelectorAll("[data-counter]"));
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!counters.length || prefersReducedMotion || !("IntersectionObserver" in window)) {
        return;
    }

    const DURATION = 1600;
    const FIGURE_SPACE = " "; // same width as a digit, keeps the layout stable

    function format(value, decimals, length) {
        const text = value.toFixed(decimals);
        return text.padStart(length, FIGURE_SPACE);
    }

    function prepare(counter) {
        const finalText = counter.textContent.trim();
        const target = parseFloat(counter.dataset.counter);
        const decimals = parseInt(counter.dataset.decimals || "0", 10);

        if (!Number.isFinite(target) || finalText !== target.toFixed(decimals)) {
            return null; // leave unusual values (e.g. "1,250") untouched
        }

        const accessibleCopy = document.createElement("span");
        accessibleCopy.className = "visually-hidden";
        accessibleCopy.textContent = finalText;

        counter.setAttribute("aria-hidden", "true");
        counter.after(accessibleCopy);
        counter.textContent = format(0, decimals, finalText.length);

        return { counter: counter, target: target, decimals: decimals, finalText: finalText, accessibleCopy: accessibleCopy };
    }

    function animate(state) {
        let startTime = null;

        function step(now) {
            if (startTime === null) {
                startTime = now;
            }

            const progress = Math.min((now - startTime) / DURATION, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic

            state.counter.textContent = format(state.target * eased, state.decimals, state.finalText.length);

            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                state.counter.textContent = state.finalText;
                state.counter.removeAttribute("aria-hidden");
                state.accessibleCopy.remove();
            }
        }

        window.requestAnimationFrame(step);
    }

    const states = new Map();

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                observer.unobserve(entry.target);
                animate(states.get(entry.target));
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(function (counter) {
        const state = prepare(counter);

        if (state) {
            states.set(counter, state);
            observer.observe(counter);
        }
    });
})();
