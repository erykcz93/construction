/**
 * Aldervane — projects-filter.js
 * --------------------------------------------------------------------------
 * Filters the portfolio on projects.html by category.
 *   - Filter buttons use aria-pressed to announce the active category.
 *   - Non-matching projects receive the hidden attribute.
 *   - A polite live region ([data-filter-status]) announces the result.
 *
 * To add a category: add a button with data-filter-value="your-category"
 * and give the matching projects data-category="your-category".
 * Without JavaScript the filter is hidden and all projects stay visible.
 */
(function () {
    "use strict";

    const filter = document.querySelector("[data-filter]");
    const list = document.querySelector("[data-filter-list]");

    if (!filter || !list) {
        return;
    }

    const buttons = Array.from(filter.querySelectorAll("[data-filter-value]"));
    const items = Array.from(list.querySelectorAll("[data-category]"));
    const status = document.querySelector("[data-filter-status]");

    function describeResult(count, value, label) {
        const noun = count === 1 ? "project" : "projects";

        if (value === "all") {
            return "Showing all " + count + " " + noun + ".";
        }

        return "Showing " + count + " " + label.toLowerCase() + " " + noun + ".";
    }

    function applyFilter(button) {
        const value = button.dataset.filterValue;
        let visibleCount = 0;

        items.forEach(function (item) {
            const matches = value === "all" || item.dataset.category === value;

            item.hidden = !matches;

            if (matches) {
                visibleCount += 1;
            }
        });

        buttons.forEach(function (other) {
            other.setAttribute("aria-pressed", String(other === button));
        });

        if (status) {
            status.textContent = describeResult(visibleCount, value, button.textContent.trim());
        }
    }

    buttons.forEach(function (button) {
        button.addEventListener("click", function () {
            applyFilter(button);
        });
    });
})();
