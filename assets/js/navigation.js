/**
 * Aldervane — navigation.js
 * --------------------------------------------------------------------------
 * Accessible mobile navigation (used below 1200px, see layout.css).
 *   - The toggle button reports its state with aria-expanded.
 *   - Opening the menu moves focus to the first link; closing it with the
 *     Escape key returns focus to the toggle button.
 *   - While the menu is open, Tab and Shift+Tab stay inside it and the rest
 *     of the page is made inert (not reachable by keyboard or screen reader).
 *   - The menu closes automatically when the desktop layout is reached.
 */
(function () {
    "use strict";

    const toggle = document.querySelector("[data-nav-toggle]");
    const nav = document.querySelector("[data-nav]");

    if (!toggle || !nav) {
        return;
    }

    const root = document.documentElement;
    const desktopQuery = window.matchMedia("(min-width: 75em)");
    const focusableSelector = "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])";
    const outsideRegions = document.querySelectorAll(".topbar, main, .site-footer");

    function isOpen() {
        return toggle.getAttribute("aria-expanded") === "true";
    }

    function setOutsideInert(value) {
        outsideRegions.forEach(function (region) {
            region.inert = value;
        });
    }

    function getFocusableItems() {
        // The toggle stays in the focus cycle so the menu can always be closed.
        return [toggle].concat(Array.from(nav.querySelectorAll(focusableSelector)));
    }

    function handleKeydown(event) {
        if (event.key === "Escape") {
            event.preventDefault();
            closeMenu(true);
            return;
        }

        if (event.key !== "Tab") {
            return;
        }

        const items = getFocusableItems();
        const first = items[0];
        const last = items[items.length - 1];

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }

    function openMenu() {
        toggle.setAttribute("aria-expanded", "true");
        nav.classList.add("is-open");
        root.classList.add("nav-open");
        setOutsideInert(true);
        document.addEventListener("keydown", handleKeydown);

        const firstLink = nav.querySelector("a[href]");

        if (firstLink) {
            firstLink.focus();
        }
    }

    function closeMenu(returnFocus) {
        toggle.setAttribute("aria-expanded", "false");
        nav.classList.remove("is-open");
        root.classList.remove("nav-open");
        setOutsideInert(false);
        document.removeEventListener("keydown", handleKeydown);

        if (returnFocus) {
            toggle.focus();
        }
    }

    toggle.addEventListener("click", function () {
        if (isOpen()) {
            closeMenu(false);
        } else {
            openMenu();
        }
    });

    // Close the menu after a link is chosen (important for same-page anchors).
    nav.addEventListener("click", function (event) {
        if (isOpen() && event.target.closest("a")) {
            closeMenu(false);
        }
    });

    // Reset everything when the screen becomes wide enough for the desktop menu.
    desktopQuery.addEventListener("change", function (event) {
        if (event.matches && isOpen()) {
            closeMenu(false);
        }
    });
})();
