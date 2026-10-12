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

---

## 3. Businesses Dashboard (`/list`)
- **Stitch Screen**: Project `11807552340976852434`, Screen `956d782bd69a4571bba08d71317070b6` ("Smart Financial — Businesses (Dashboard)")
- **Target File(s) Changed**:
  - `my-app/src/components/business/List.jsx`
  - `my-app/src/index.css` (added `.sf-biz-list`, `.sf-biz-rw`, `.sf-biz-panel`, `.sf-bd`, `.sf-nm`, `.sf-meta`, `.sf-scope`, `.sf-acts`, `.sf-lk`)
- **New Shared Design Tokens & Styles**:
  - Split View Layout: `.sf-biz-list` (left business selection list, 460px max-width), `.sf-biz-panel` (right inspector panel, 560px min-height, 36px padding).
  - Business Item Card: `.sf-biz-rw` (neo-brutalist border-box, inset 8px border on active, hover `#E4EBDC`).
  - Active & Status Badges: `.sf-bd` / `.sf-bd-on` (`Currently active` / `Not active` badge).
  - Metadata & Scopes: `.sf-nm` (headline display name), `.sf-meta` with dotted leaders (`border-bottom: 2px dotted #9FB09A`), `.sf-scope` list tags.
- **Logic & Functionality Preserved**:
  - Session verification: `axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/login/session`, { withCredentials: true })`, redirects to `/login` if unauthenticated.
  - Business loading: `axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/showbusinesses`, { withCredentials: true })`.
  - Selection handler: `handleSelectBusiness` sets `selectedBusiness` via `selectBusiness(business)` in context and navigates to `/showbusinessaccount`.
  - Delete handler: `handleDeleteBusiness` confirms deletion via `window.confirm`, calls `axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/business/${businessId}`)`, updates context, clears `selectedBusiness` if deleted.
  - Edit handler: `navigate('/business', { state: { business: currentBiz } })`.
  - Create business: links to `/business`.
  - Formats: `formatBusinessType` and `formatDate` helper functions.
  - Interactive split-panel switching via `inspectedBusinessId` state.
- **Skipped / Inert Stitch Elements**:
  - Inline "Ask the active business a question" input at the bottom of the Stitch screen was omitted to avoid creating an unbacked API endpoint, as user assistance is globally handled by `FloatingChatbot.jsx` across the application.
- **Decisions / Questions for User**:
  - Split inspector view defaults to the currently active business in context or the first business in the account. Clicking any item on the left smoothly updates the right inspection panel.

---

## 4. Chart of Accounts — Ledgers (`/showbusinessaccount`)
- **Stitch Screen**: Project `11807552340976852434`, Screen `65825b7ccad544519b40782009baec80` ("Smart Financial — Chart of Accounts (Ledgers)")
- **Target File(s) Changed**:
  - `my-app/src/components/accounts/ShowBusinessAccount.jsx`
  - `my-app/src/index.css` (added `.sf-cp`, `.sf-coa-idx`, `.sf-coa-g`, `.sf-coa-gh`, `.sf-coa-rw`, `.sf-coa-nmx`, `.sf-coa-bl`, `.sf-coa-pn`, `.sf-coa-panel`, `.sf-coa-tp`, `.sf-coa-nm`, `.sf-coa-bal`, `.sf-coa-table`)
- **New Shared Design Tokens & Styles**:
  - Command & Control Bar: `.sf-cp` banner with active business breadcrumbs, entity badges, Search accounts input (`#E4EBDC` focus ring), category filter toggle pills (`ALL`, `ASSETS`, `LIABILITIES`, `EQUITY`, `INCOME`, `EXPENSES`), and primary "+ New account" CTA (`/accountForm`).
  - Master-Detail Split: Left index `.sf-coa-idx` (max-width 480px, grouped by accounting category with subheaders `.sf-coa-gh` and subtotals) and right inspector `.sf-coa-pn` / `.sf-coa-panel` (interactive account breakdown, balance card `.sf-coa-bal`, metadata, and transaction activity summary).
  - Account Items: `.sf-coa-rw` with neo-brutalist 2px border, active left border bar (`#C8F135`), account code badges, debit/credit indicators, and row hover transitions.
  - Actions: Direct inspection link to ledger transactions (`/ledger-balancing` with ledger name), edit account (`/accountForm` passing account state), and delete account with confirmation modal.
- **Logic & Functionality Preserved**:
  - API Fetch: `axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/accounts-list/${selectedBusiness.id}`)`.
  - Account Deletion: `axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/accounts/${accountId}`)` with error handling, modal confirmations, and state updates.
  - Business context integration: `useBusiness()` (`selectedBusiness`) with redirect to `/list` if no business selected.
  - Filtering & Search: dynamic category classification mapping (`Assets`, `Liabilities`, `Equity`, `Income`, `Expenses`) based on `account.type_name`, realtime search filtering, and subtotal rollups.
  - Navigation: "+ New account" -> `/accountForm`, edit -> `/accountForm` with state, view transactions -> `/ledger-balancing`.
- **Skipped / Inert Stitch Elements**:
  - Inline static mockup data replaced with live accounting category groups and active balance calculation from actual ledger records.
- **Decisions / Questions for User**:
  - Accounts are automatically categorized into standard double-entry groups (Assets, Liabilities, Equity, Income, Expenses) based on `type_name` while preserving custom account types.



