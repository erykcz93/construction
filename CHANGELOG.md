# Changelog

All notable changes to this template are documented in this file.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [1.0.0] — 2026-09-28

### Added
- 13 HTML pages:
  - `index`, `about`, `services`, `service-details`
  - `projects`, `project-details`, `team`
  - `blog`, `blog-details`, `faq`, `contact`
  - `404`, `privacy-policy`
- Design system in `assets/css/variables.css` (colours, typography, spacing, radius, shadows, layout).
- Modular CSS: `reset`, `variables`, `base`, `layout`, `components`, `pages`, `utilities`, `animations`, `noscript`.
- Vanilla JavaScript modules:
  - `main`, `navigation`, `accordion`, `projects-filter`
  - `form-validation`, `animations`, `counters`
- PHP contact form backend (`php/contact.php`, `php/config.example.php`):
  - CSRF token and same-origin check
  - Honeypot, minimum fill-in time and rate limiting
  - Header-injection protection
  - Test mode for local development
- 27 original SVG icons.
- Original SVG illustrations and placeholders: hero, about, services, nine projects, a project gallery, eight team portraits, six blog images, map and 404.
- Logo mark, favicons (SVG, ICO, PNG), web app manifest and Open Graph image.
- SEO files: `robots.txt`, `sitemap.xml`, meta tags, canonical URLs, Open Graph and Twitter/X cards, structured data.
- Optional Apache `.htaccess` with a 404 page, compression, caching and security headers.
- Documentation (`documentation/index.html`), `README.md` and `licenses/THIRD_PARTY_NOTICES.md`.
