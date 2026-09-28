/**
 * Aldervane — accordion.js
 * --------------------------------------------------------------------------
 * Accessible accordion following the WAI-ARIA Authoring Practices pattern.
 *
 * Markup (see faq.html):
 *   <div class="accordion" data-accordion>
 *     <div class="accordion__item">
 *       <h3 class="accordion__heading">
 *         <button class="accordion__trigger" id="q1-trigger" aria-expanded="false" aria-controls="q1-panel">…</button>
 *       </h3>
 *       <div class="accordion__panel" id="q1-panel" role="region" aria-labelledby="q1-trigger" hidden>…</div>
 *     </div>
 *   </div>
 *
 * Keyboard: Enter / Space toggle a question (native button behaviour),
 * Arrow Down / Arrow Up move between questions, Home / End jump to the
 * first / last question.
 * Options: add data-accordion="single" to keep only one answer open.
 * Deep links: faq.html#faq-3-panel opens that answer (on load and on hash change).
 */
(function () {
    "use strict";

    /* Element referenced by the URL hash, or null (malformed hashes are ignored). */
    function getHashTarget() {
        if (window.location.hash.length < 2) {
            return null;
        }

        try {
            return document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
        } catch (error) {
            return null;
        }
    }

    function getPanel(trigger) {
        return document.getElementById(trigger.getAttribute("aria-controls"));
    }

    function setExpanded(trigger, expanded) {
        const panel = getPanel(trigger);

        trigger.setAttribute("aria-expanded", String(expanded));

        if (panel) {
            panel.hidden = !expanded;
        }
    }

    function initAccordion(accordion) {
        const triggers = Array.from(accordion.querySelectorAll(".accordion__trigger"));
        const singleMode = accordion.dataset.accordion === "single";

        triggers.forEach(function (trigger) {
            trigger.addEventListener("click", function () {
                const willExpand = trigger.getAttribute("aria-expanded") !== "true";

                if (singleMode && willExpand) {
                    triggers.forEach(function (other) {
                        if (other !== trigger) {
                            setExpanded(other, false);
                        }
                    });
                }

                setExpanded(trigger, willExpand);
            });

            trigger.addEventListener("keydown", function (event) {
                const index = triggers.indexOf(trigger);
                let target;

                switch (event.key) {
                    case "ArrowDown":
                        target = triggers[(index + 1) % triggers.length];
                        break;
                    case "ArrowUp":
                        target = triggers[(index - 1 + triggers.length) % triggers.length];
                        break;
                    case "Home":
                        target = triggers[0];
                        break;
                    case "End":
                        target = triggers[triggers.length - 1];
                        break;
                    default:
                        return;
                }

                event.preventDefault();
                target.focus();
            });
        });

        // Open the answer referenced in the URL, e.g. faq.html#faq-3-panel
        function openFromHash() {
            const hashTarget = getHashTarget();

            if (hashTarget && accordion.contains(hashTarget) && hashTarget.classList.contains("accordion__panel")) {
                const linkedTrigger = document.getElementById(hashTarget.getAttribute("aria-labelledby"));

                if (linkedTrigger) {
                    setExpanded(linkedTrigger, true);
                }
            }
        }

        openFromHash();
        window.addEventListener("hashchange", openFromHash);
    }

    document.querySelectorAll("[data-accordion]").forEach(initAccordion);
})();
