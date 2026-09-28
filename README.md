# Aldervane — Construction Company HTML Template

A premium, multi-page HTML5 website template for construction companies, general contractors, builders and renovation firms. It is built with plain HTML, CSS and vanilla JavaScript: no frameworks, no build step and no dependencies to install.

> **Demo content notice:** All company names, persons, testimonials, statistics and project descriptions included in this template are fictional demo content and should be replaced by the end user.

The full documentation is in **`documentation/index.html`**. Open it in any browser.

---

## Project overview

- **Brand (fictional):** Aldervane Construction, a general contractor.
- **Design language:** "Blueprint Precision". Dark ink sections, warm concrete neutrals and an amber accent, with details taken from technical drawings: dimension lines, numbered sections and fine grids.
- **Version:** 1.0.0 (see `CHANGELOG.md`).

## Features

- 13 ready-made pages, including blog and case-study templates
- Responsive, mobile-first layouts, tested from 320 px to 1920 px wide
- Every design setting in one file (`assets/css/variables.css`): colours, fonts, spacing, radius, shadows and container width
- Accessible mobile menu with focus management and Escape to close
- Accessible FAQ accordion (WAI-ARIA pattern with arrow-key navigation)
- Portfolio filter with a screen-reader status message
- Working contact form:
  - Front-end validation with accessible error messages
  - PHP backend without external libraries
  - CSRF token and same-origin check
  - Honeypot and minimum fill-in time against spam
  - Rate limiting
  - Header-injection protection
- Animated counters and reveal-on-scroll effects, both disabled for visitors who prefer reduced motion
- Works without JavaScript: navigation, FAQ answers and all content stay usable
- No inline JavaScript or CSS, so the template works with a strict Content Security Policy
- SEO basics on every page:
  - Unique titles and meta descriptions
  - Open Graph and Twitter/X cards
  - Canonical URLs
  - `sitemap.xml` and `robots.txt`
  - Structured data on the homepage
- Performance-minded:
  - Only the JavaScript each page needs is loaded, and it is deferred
  - Images are lazy-loaded with fixed dimensions (no layout shift)
  - `font-display: swap` for web fonts
- 100% original SVG icons and illustrations; the only external resource is Google Fonts

## Technology stack

| Layer | Technology |
| --- | --- |
| Markup | HTML5 (semantic elements, ARIA only where needed) |
| Styles | CSS3 with custom properties, Grid and Flexbox, BEM naming |
| Scripts | Vanilla JavaScript (ES2017+), one file per feature, `"use strict"` |
| Form backend | PHP 8.0+ (no libraries, no Composer) |
| Fonts | Archivo and Inter from Google Fonts (SIL Open Font License 1.1) |

## Pages included

| File | Page |
| --- | --- |
| `index.html` | Homepage (hero, stats, about, services, why us, projects, process, numbers, testimonials, team, CTA, FAQ, contact) |
| `about.html` | About: story, mission and vision, values, experience, statistics, leadership, process |
| `services.html` | Nine services with icons, descriptions and links |
| `service-details.html` | Single service template with sidebar, benefits, process and checklist |
| `projects.html` | Portfolio with a JavaScript category filter |
| `project-details.html` | Case study: scope, timeline, challenge, solution, results and gallery |
| `team.html` | Team introduction and member cards |
| `blog.html` | Blog listing with a featured article |
| `blog-details.html` | Article template with rich typography |
| `faq.html` | Twelve questions in four groups |
| `contact.html` | Contact details, opening hours, form, map placeholder and hints |
| `404.html` | Error page |
| `privacy-policy.html` | Privacy policy **template** (must be adapted before publishing) |

## Folder structure

```
construction-template/
├── index.html … privacy-policy.html   13 pages
├── robots.txt, sitemap.xml            SEO files (replace example.com)
├── site.webmanifest                   Icons and colours for mobile devices
├── .htaccess                          Optional Apache settings (404, caching, headers)
├── assets/
│   ├── css/     reset · variables · base · layout · components · pages ·
│   │            utilities · animations · noscript
│   ├── js/      main · navigation · accordion · projects-filter ·
│   │            form-validation · animations · counters
│   ├── images/  logo · favicon · hero · about · services · projects ·
│   │            team · blog · social · misc
│   └── icons/   27 original SVG icons
├── php/
│   ├── contact.php          Form handler
│   ├── config.example.php   Copy to config.php and add your email
│   └── .htaccess            Blocks direct access to config files
├── documentation/           Full documentation (do not upload to your live site)
├── licenses/THIRD_PARTY_NOTICES.md
├── README.md
└── CHANGELOG.md
```

Media queries are written mobile-first and kept next to the component they belong to, instead of in a separate `responsive.css` file. When you edit a component, all its breakpoints are in one place.

## Installation

1. Unzip the package.
2. **Preview locally.** Open `index.html` in a browser, or run a local server from the project folder:
   ```bash
   php -S localhost:8000
   ```
   Then visit http://localhost:8000. The contact form needs PHP, so use the PHP server to test it.
3. **Configure the form.** Copy `php/config.example.php` to `php/config.php` and set `recipient_email` to your address.
4. **Replace demo content.** Update texts, contact details, images and the `https://www.example.com` placeholders (canonical URLs, Open Graph tags, `sitemap.xml`, `robots.txt`, structured data).
5. **Upload** everything except the `documentation/` folder to your web hosting.

## Configuration

| What | Where |
| --- | --- |
| Colours, fonts, spacing, radius, container width | `assets/css/variables.css` |
| Fonts (family and weights) | Google Fonts `<link>` in each page `<head>` + `--font-heading` / `--font-body` |
| Company name, phone, email, address, hours | Header, top bar and footer of each page; `contact.html`; structured data in `index.html` |
| Logo | `assets/images/logo/logo-mark.svg` and the logo text in the header and footer |
| Contact form | `php/config.php` (created from `config.example.php`) |
| Domain for SEO tags | Replace `https://www.example.com` in all pages, `sitemap.xml` and `robots.txt` |

Detailed, step-by-step instructions are in `documentation/index.html`.

## Browser support

Current versions of Chrome, Edge, Firefox and Safari (macOS and iOS), and Chrome for Android. Internet Explorer is not supported.

## Credits

- **Fonts:** Archivo by Omnibus-Type and Inter by Rasmus Andersson, via Google Fonts, both under the SIL Open Font License 1.1.
- **Icons, logo, illustrations, favicons and Open Graph image:** created from scratch for this template.
- **Code:** written from scratch; no third-party libraries.

## Licensing notes

- Third-party resources and their licenses are listed in `licenses/THIRD_PARTY_NOTICES.md`. The only external resource is Google Fonts.
- The fonts are loaded from Google Fonts and are not redistributed in this package.
- Social network names in the footer are plain-text links only. No third-party logos are included.
- `privacy-policy.html` is a template. It does not by itself make a website compliant with the GDPR, the CCPA or any other law.
- The license for the template itself is defined by the marketplace or agreement under which you obtained it.
