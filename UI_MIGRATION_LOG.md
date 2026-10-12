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

---

## 2. Navbar Design & Spec (Global Navbar & Home Navbar)
- **Stitch Screen**: Project `11807552340976852434`, Screen `1c20d0663e5f429a83306b9da56c4419` ("Smart Financial — Navbar Design & Spec")
- **Target File(s) Changed**:
  - `my-app/src/components/layout/Navbar.jsx` (Global application navbar)
  - `my-app/src/components/landing/LandingPage.jsx` (Home page navbar)
  - `my-app/src/index.css` (added Stitch Navbar spec classes, micro-animations, dropdown panels, and responsive styles)
- **New Shared Design Tokens & Styles**:
  - Header & Banner: `.sf-ub` (top single-entity context utility banner), `.sf-nav-header` (76px height, 2px border `#0E1A14`), `.sf-nb`
  - Brand & Triggers: `.sf-logo`, `.sf-logo-box` (34x34px neo-brutalist container with stroke `#C8F135`), `.sf-tr` (interactive scaleY hover sweep pseudo-element animation), `.sf-tr.cur` (active route underline), `.sf-cr` (180deg rotating caret)
  - Action Buttons: `.sf-tr-post` (accent lime CTA button with 2px ink shadow, hover translateY(-2px)), `.sf-chip` (active business switcher pill), `.sf-av` (user avatar with initial badge)
  - Dropdowns & Cards: `.sf-pnl` (animated dropdown popover with fade and 8px slide), `.sf-pc` (neo-brutalist container with 6px 6px shadow), `.sf-p-rep` (620px mega menu), `.sf-p-biz` (380px business switcher), `.sf-p-usr` (290px account menu), `.sf-mi` (dropdown item with sliding arrow `.sf-ar` and lime highlight)
- **Logic & Functionality Preserved**:
  - In `Navbar.jsx`:
    - Session API call: `axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/login/session`, { withCredentials: true })`
    - Logout handler: `axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/auth/logout`, { withCredentials: true })`, `localStorage.clear()`, `clearBusiness()`, redirection to `/`
    - Context bindings: `useBusiness()` (`selectedBusiness`, `clearBusiness`, `businesses`, `selectBusiness`)
    - Navigation routes: Home (`/`), Businesses (`/list`), Ledgers (`/showbusinessaccount`), Post transactions (`/transectionForm`), Contact (`/contact`), Profile (`/profile`)
    - Reports menu: Ledger (`/ledger-balancing` with state `{ selectedLedger: 'all' }`), Trial balance (`/trial-balance`), Income statement (`/income-report`), Balance sheet (`/balance-sheet`), General journal (`/showtransections`)
    - Business switcher: switches active business via `selectBusiness(b)` and navigates to `/showbusinessaccount`, "+ New business" (`/business`), "Manage all →" (`/list`)
    - Mobile responsive drawer toggle (`isMobileMenuOpen`)
  - In `LandingPage.jsx`:
    - Clean landing navbar layout: Middle navigation links (Home, Businesses, Ledgers, Post transactions, Contact) removed per user instruction so they do not show in either logged-in or logged-out states on the landing page.
    - Authenticated state (`user`) vs guest state (`!user`)
    - Visitor tracking & clicks transactions to Firebase
    - Dashboard button (`navigate('/list')`)
    - User account dropdown (`.sf-av`) with profile, businesses, contact, and logout links
    - Logout handler (`handleLogout`)
    - Guest actions ("Log in" -> `/login`, "Create account" -> `/register`)
- **Skipped / Inert Stitch Elements**:
  - Middle navigation links on landing page (`.sf-nv`) omitted per user request.
  - Static preview cards rendered below the navbar in the Stitch documentation screen were excluded per user instructions ("This Design Is Looking like page but there is only visualized infromation about Navbar So Copy Only Design Instead of Copy whole page").
- **Decisions / Questions for User**:
  - General Journal route (`/showtransections`) was preserved and styled in the reports mega menu so no existing platform capability was lost.

