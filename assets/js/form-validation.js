/**
 * Aldervane — form-validation.js
 * --------------------------------------------------------------------------
 * Client-side validation and secure submission for every form marked with
 * data-contact-form (homepage and contact page).
 *
 *   - Accessible error messages: each field points to its message with
 *     aria-describedby and gets aria-invalid="true" when it is not valid.
 *   - Messages appear when a field is left, and disappear as soon as the
 *     problem is fixed. On submit, focus moves to the first invalid field.
 *   - A security token (CSRF) is requested from php/contact.php the first
 *     time a visitor interacts with the form, then sent with the message.
 *   - The message is sent with fetch() and the result is announced in the
 *     form's live region ([data-form-status]).
 *
 * The server (php/contact.php) validates everything again — never rely on
 * browser validation alone.
 */
(function () {
    "use strict";

    const forms = document.querySelectorAll("[data-contact-form]");

    if (!forms.length) {
        return;
    }

    /* Messages shown to visitors. Edit the wording here if needed. */
    const MESSAGES = {
        required: "This field is required.",
        name: "Please enter your full name (at least 2 characters).",
        email: "Please enter a valid email address, for example name@example.com.",
        phone: "Please enter a valid phone number using digits, spaces, +, - or brackets.",
        service: "Please choose a project type.",
        message: "Please describe your project in at least 20 characters.",
        consent: "Please confirm that we may use your details to reply to you.",
        tooLong: "This entry is too long.",
        summary: "Please correct the highlighted fields and try again.",
        sending: "Sending your message…",
        success: "Thank you! Your message has been sent. We will reply within one business day.",
        failure: "Sorry, your message could not be sent. Please try again later or contact us by phone or email."
    };

    const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const PHONE_PATTERN = /^[0-9+().\-\s]{6,40}$/;
    const IGNORED_FIELDS = ["csrf_token", "form_source", "company_website"];

    /* ---------------------------------------------------------------------
       Validation rules
       --------------------------------------------------------------------- */
    function validateField(field) {
        const value = field.type === "checkbox" ? "" : field.value.trim();
        const maxLength = field.maxLength > 0 ? field.maxLength : Infinity;

        if (value.length > maxLength) {
            return MESSAGES.tooLong;
        }

        switch (field.name) {
            case "name":
                return value.length >= 2 ? "" : MESSAGES.name;
            case "email":
                if (!value) {
                    return MESSAGES.required;
                }
                return EMAIL_PATTERN.test(value) ? "" : MESSAGES.email;
            case "phone":
                return !value || PHONE_PATTERN.test(value) ? "" : MESSAGES.phone;
            case "service":
                return value ? "" : MESSAGES.service;
            case "message":
                return value.length >= 20 ? "" : MESSAGES.message;
            case "consent":
                return field.checked ? "" : MESSAGES.consent;
            default:
                return field.required && !value ? MESSAGES.required : "";
        }
    }

    function getFields(form) {
        return Array.from(form.elements).filter(function (element) {
            return element.name &&
                element.type !== "hidden" &&
                element.type !== "submit" &&
                IGNORED_FIELDS.indexOf(element.name) === -1;
        });
    }

    function showFieldError(field, message) {
        const error = document.getElementById(field.id + "-error");

        if (message) {
            field.setAttribute("aria-invalid", "true");
        } else {
            field.removeAttribute("aria-invalid");
        }

        if (error) {
            error.textContent = message;
            error.hidden = !message;
        }
    }

    function validateForm(form) {
        let firstInvalid = null;

        getFields(form).forEach(function (field) {
            const message = validateField(field);

            showFieldError(field, message);

            if (message && !firstInvalid) {
                firstInvalid = field;
            }
        });

        return firstInvalid;
    }

    /* ---------------------------------------------------------------------
       Status messages (live region)
       --------------------------------------------------------------------- */
    function setStatus(form, message, type) {
        const status = form.querySelector("[data-form-status]");

        if (!status) {
            return;
        }

        status.classList.remove("form-status--success", "form-status--error");

        if (type) {
            status.classList.add("form-status--" + type);
        }

        status.textContent = message;
    }

    /* ---------------------------------------------------------------------
       Security token (CSRF) — requested once per form, on first interaction
       --------------------------------------------------------------------- */
    const tokenRequests = new WeakMap();

    function requestToken(form) {
        if (!tokenRequests.has(form)) {
            const url = new URL(form.getAttribute("action"), window.location.href);
            url.searchParams.set("action", "token");

            const request = fetch(url.toString(), {
                credentials: "same-origin",
                headers: { "Accept": "application/json" }
            })
                .then(function (response) {
                    if (!response.ok) {
                        throw new Error("Token request failed");
                    }
                    return response.json();
                })
                .then(function (data) {
                    form.elements.csrf_token.value = data.token;
                    return data.token;
                })
                .catch(function (error) {
                    tokenRequests.delete(form); // allow a retry on the next attempt
                    throw error;
                });

            tokenRequests.set(form, request);
        }

        return tokenRequests.get(form);
    }

    /* ---------------------------------------------------------------------
       Submission
       --------------------------------------------------------------------- */
    function setBusy(form, busy) {
        const button = form.querySelector("[type='submit']");
        const label = button ? button.querySelector("[data-submit-label]") : null;

        if (!button) {
            return;
        }

        if (label && !label.dataset.defaultText) {
            label.dataset.defaultText = label.textContent;
        }

        button.disabled = busy;
        form.setAttribute("aria-busy", String(busy));

        if (label) {
            label.textContent = busy ? "Sending…" : label.dataset.defaultText;
        }
    }

    function showServerErrors(form, errors) {
        let firstInvalid = null;

        Object.keys(errors).forEach(function (name) {
            const field = form.elements[name];

            if (field && field.id) {
                showFieldError(field, String(errors[name]));
                firstInvalid = firstInvalid || field;
            }
        });

        if (firstInvalid) {
            firstInvalid.focus();
        }
    }

    async function sendForm(form) {
        setBusy(form, true);
        setStatus(form, MESSAGES.sending, "");

        try {
            await requestToken(form);

            const response = await fetch(form.action, {
                method: "POST",
                body: new FormData(form),
                credentials: "same-origin",
                headers: { "Accept": "application/json" }
            });

            let data = null;

            try {
                data = await response.json();
            } catch (parseError) {
                data = null;
            }

            if (response.ok && data && data.success) {
                form.reset();
                getFields(form).forEach(function (field) {
                    showFieldError(field, "");
                });
                tokenRequests.delete(form); // the server issues a fresh token for the next message
                setStatus(form, data.message || MESSAGES.success, "success");
                return;
            }

            if (response.status === 403) {
                tokenRequests.delete(form); // expired or missing token: request a new one next time
            }

            if (data && data.errors) {
                showServerErrors(form, data.errors);
            }

            setStatus(form, (data && data.message) || MESSAGES.failure, "error");
        } catch (error) {
            setStatus(form, MESSAGES.failure, "error");
        } finally {
            setBusy(form, false);
        }
    }

    /* ---------------------------------------------------------------------
       Initialisation
       --------------------------------------------------------------------- */
    function initForm(form) {
        // JavaScript takes over validation, so the browser's own bubbles are disabled.
        form.noValidate = true;

        // Request the security token as soon as the visitor starts using the form.
        form.addEventListener("focusin", function () {
            requestToken(form).catch(function () {
                // Errors are reported when the form is submitted.
            });
        }, { once: true });

        getFields(form).forEach(function (field) {
            let touched = false;

            field.addEventListener("input", function () {
                touched = true;

                // Clear an existing error as soon as the value becomes valid.
                if (field.getAttribute("aria-invalid") === "true") {
                    showFieldError(field, validateField(field));
                }
            });

            field.addEventListener("change", function () {
                touched = true;
            });

            field.addEventListener("blur", function () {
                if (touched) {
                    showFieldError(field, validateField(field));
                }
            });
        });

        form.addEventListener("submit", function (event) {
            event.preventDefault();

            const firstInvalid = validateForm(form);

            if (firstInvalid) {
                setStatus(form, MESSAGES.summary, "error");
                firstInvalid.focus();
                return;
            }

            sendForm(form);
        });
    }

    forms.forEach(initForm);
})();
