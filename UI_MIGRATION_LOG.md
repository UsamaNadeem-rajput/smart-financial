# UI Migration Log (Stitch Redesign)

Branch: `ui-stitch-migration`

---

## 1. Landing Page (`/`)
- **Stitch Screen**: Project `1850777105332051393`, Screen `515fbeff3b0049ad81b7b84a6f70d224` ("Smart Financials — Complete 6 Features & Real-Time Insights")
- **Target File(s) Changed**:
  - `my-app/src/components/landing/LandingPage.jsx`
  - `my-app/index.html` (added Bricolage Grotesque & DM Sans Google Fonts)
  - `my-app/tailwind.config.js` (added `sf` design tokens and font families)
  - `my-app/src/index.css` (added `:root` variables, glass chips, telemetry bar glow, step stroke, marquee keyframes)
- **New Shared Design Tokens & Styles**:
  - Palette: `sf-ink` (`#0F1E14`), `sf-ink-card` (`#15271B`), `sf-ink-dark` (`#08110B`), `sf-lime` (`#C8F135`), `sf-lime-soft` (`#D9F926`), `sf-lime-bright` (`#CCFF00`), `sf-cream` (`#F3F4EC`), `sf-cream-muted` (`#E5E7DC`), `sf-gray-muted` (`#6C7A70`).
  - Typography: `font-display` (Bricolage Grotesque), `font-sans` (DM Sans).
  - Utilities: `.glass-chip`, `.glass-dark`, `.btn-pulse`, `.animate-marquee`, `.step-stroke`, `.telemetry-bar-glow`, `.tabular-nums`.
- **Logic & Functionality Preserved**:
  - Session endpoint check: `GET /api/login/session` with `withCredentials: true`.
  - Firebase visitor count transaction (`site_stats/visitors`).
  - Firebase live stats synchronization (`site_stats`).
  - Firebase global click interaction tracking (`site_stats/clicks`) with 1-second debounce.
  - Logout handler: `GET /api/auth/logout` with `withCredentials: true`, localStorage clearing, redirection to `/login`.
  - Conditional rendering: Authenticated user menu (`Welcome, {user}`, `Dashboard` linking to `/list`, `Logout`, `/profile`) vs Guest menu (`Login`, `Start Free Trial` linking to `/register`).
  - Real metric bindings: `stats.visitors.toLocaleString()` and `stats.clicks.toLocaleString()` bound directly into Telemetry Bento cards.
- **Skipped / Inert Stitch Elements**:
  - "Watch 2-Minute Demo" button in hero: Rendered inert / scroll to `#how-it-works` (no video demo modal exists in current app).
  - Review / Later notification chip buttons in hero: Rendered inert (visual demonstration of AI suggestions).
  - Invoicing card hover tilt and 9-bar telemetry histogram: Fully rendered and animated with tooltips.
- **Open Questions / Decisions for User**:
  - None for Landing Page. All functionality, routes, and styles verified.
