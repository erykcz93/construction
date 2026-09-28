/**
 * Aldervane — main.js
 * --------------------------------------------------------------------------
 * Small site-wide helpers used on every page:
 *   1. Keeps the copyright year in the footer up to date.
 *   2. Adds a shadow to the sticky header once the page has been scrolled.
 */
(function () {
    "use strict";

    /* Replace the text of every [data-current-year] element with this year. */
    function updateCopyrightYear() {
        const year = String(new Date().getFullYear());

        document.querySelectorAll("[data-current-year]").forEach(function (element) {
            element.textContent = year;
        });
    }

    /* Toggle the "is-scrolled" class on the header (styled in layout.css). */
    function initHeaderShadow() {
        const header = document.querySelector("[data-site-header]");

        if (!header) {
            return;
        }

        let ticking = false;

        function update() {
            header.classList.toggle("is-scrolled", window.scrollY > 8);
            ticking = false;
        }

        window.addEventListener("scroll", function () {
            if (!ticking) {
                window.requestAnimationFrame(update);
                ticking = true;
            }
        }, { passive: true });

        update();
    }

    updateCopyrightYear();
    initHeaderShadow();
})();
