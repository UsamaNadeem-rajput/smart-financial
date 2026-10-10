# UI Migration Log (Stitch Redesign)

Branch: `ui-stitch-migration`

---

## 1. Landing Page (`/`)
- **Stitch Screen**: Project `11807552340976852434`, Screen `ed9d33833c3b40b887d817948ea3406d` ("Smart Financial — Home (Exact Replica)")
- **Target File(s) Changed**:
  - `my-app/src/components/landing/LandingPage.jsx`
  - `my-app/index.html` (added Bricolage Grotesque & Instrument Sans Google Fonts)
  - `my-app/tailwind.config.js` (added `brand.lime`, `brand.ink`, `brand.paper`, and display/sans typography tokens)
  - `my-app/src/index.css` (added neo-brutalist `.sf-btn`, `.sf-chk`, `.sf-sec`, `.lh-paper`, `.lh-stamp`, keyframes, pause toggle `.lh-paused`)
- **New Shared Design Tokens & Styles**:
  - Palette: `brand.lime` (`#C8F135`), `brand.ink` (`#0E1A14`), `brand.paper` (`#F2F5EE`), `brand.muted` (`#44544B`), `brand.border` (`#C9D3C2`), `brand.darkBorder` (`#2C3F34`), `brand.darkMuted` (`#8FA196`), `brand.darkText` (`#B9C6BD`).
  - Typography: `font-sans` with `Instrument Sans`, `font-display` with `Bricolage Grotesque`.
  - Utilities: `.sf-wrap`, `.sf-btn`, `.sf-btn-lime`, `.sf-btn-ink`, `.sf-btn-line`, `.sf-chk`, `.sf-sec`, `.ftl`, `.lh-paper`, `.lh-stem`, `.lh-sweep`, `.lh-stamp`, `.lh-paused`.
- **Logic & Functionality Preserved**:
  - Session endpoint check: `GET ${import.meta.env.VITE_BACKEND_URL}/api/login/session` with `withCredentials: true`.
  - Firebase visitor count transaction (`site_stats/visitors`).
  - Firebase live stats synchronization (`site_stats`).
  - Firebase global click interaction tracking (`site_stats/clicks`) with 1-second debounce.
  - Logout handler: `GET ${import.meta.env.VITE_BACKEND_URL}/api/auth/logout` with `withCredentials: true`, localStorage clearing, redirection to `/login`.
  - Conditional rendering: Authenticated user menu (`Welcome, {user}`, `Dashboard` linking to `/list`, `Logout`, `/profile`) vs Guest menu (`Log in` linking to `/login`, `Create account` linking to `/register`).
  - Mobile menu toggle state and drawer (`isMobileMenuOpen`).
  - Animation play/pause state toggle (`isPaused`).
  - Real metric bindings: `stats.visitors.toLocaleString()` and `stats.clicks.toLocaleString()` actively displayed in the top proof/telemetry bar.
  - Direct routes attached to interactive statements: Ledger (`/ledger-balancing`), Trial Balance (`/trial-balance`), Income Statement (`/income-report`), Balance Sheet (`/balance-sheet`).
- **Skipped / Inert Stitch Elements**:
  - None. All interactive buttons, cards, pause controls, navigation routes, and reports links are fully wired to active platform routes and handlers.
- **Decisions / Questions for User**:
  - None for Landing Page. All functionality, routes, and styles verified.
