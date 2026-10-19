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

---

## 5. Post Transaction Voucher (`/transectionForm`)
- **Stitch Screen**: Project `18290502498789531250`, Screen `3a8e10556b0c41afaf2fccadc77a94ee` ("Smart Financial — Post transaction")
- **Target File(s) Changed**:
  - `my-app/src/components/transactions/TransactionForm.jsx`
  - `my-app/src/index.css` (added `.sf-vc`, `.sf-stub`, `.sf-vn`, `.sf-stub-cap`, `.sf-vbody`, `.sf-r3`, `.sf-hd3`, `.sf-am`, `.sf-ac`, `.sf-dd`, `.sf-op`, `.sf-rm`, `.sf-addr`, `.sf-tots`, `.sf-lb`, `.sf-tn`, `.sf-trk`, `.sf-st`, `.sf-acts2`, `.sf-rc`, `.sf-rcb`, `.sf-vmdl`, `.sf-vmc`, `.sf-vmh`, `.sf-vmb`)
- **New Shared Design Tokens & Styles**:
  - Neo-Brutalist Voucher Slip Layout: `.sf-vc` container with 2px ink border, 6px 6px shadow, and left-right master split.
  - Perforated Stub: `.sf-stub` with dashed right border, pseudo-element semicircular punch-outs (`::before`, `::after`), huge 76px display voucher number (`.sf-vn`), automatic next voucher indicator, date selector, and time badge.
  - Transaction Entry Grid: `.sf-r3` 4-column responsive grid (Ledger Name, Debit $, Credit $, Remove ✕).
  - Searchable Autocomplete: `.sf-ac` with animated dropdown `.sf-dd`, keyboard arrow navigation, active highlight, and live account balance display (`.sf-op`).
  - Mutual Lock Behavior: Debit entry locks Credit field, Credit entry locks Debit field with dashed textured styling.
  - Live Balance Telemetry: Dual progress track bars (`.sf-trk`) measuring Debit vs Credit ratio, display totals (`.sf-tn`), and dynamic status banner (`.sf-st` ok/bad/idle).
  - Actions: Neo-brutalist buttons ("Save and New", "Save and Close", "Close"), and collapsible "Recalculate balances" utility details panel (`.sf-rc`).
  - Voucher Confirmation Modal: Animated `.sf-vmdl` with lime header, transaction metadata breakdown, and instant workflow continuation.
- **Logic & Functionality Preserved**:
  - Voucher Number Sync: `GET /api/next-transaction-id/${selectedBusiness.business_id}`.
  - Search Autocomplete: `GET /api/search-accounts?query=${value}&business_id=${business_id}`.
  - Transaction Submission: `POST /api/transactions` with exact double-entry payload (`transaction_id`, `business_id`, `debit`, `credit`, `date`, `entries`).
  - Recalculate Balances: `POST /api/recalculate-balances/${business_id}`.
  - Business Context: `useBusiness()` hook integration.
  - Success Audio & State: `/success.mp3` audio chime, automatic form reset for "Save and New", back navigation for "Save and Close".
  - Row Validations: Debits must equal credits, account names must be valid, minimum 2 rows enforced.
- **Skipped / Inert Stitch Elements**:
  - None. All controls, dropdowns, inputs, progress bars, audio, and recalculation utilities are fully wired to active platform APIs.
- **Decisions / Questions for User**:
  - None for Post Transaction. The voucher layout and dual lock mechanisms match the Stitch design and behave identically to existing backend contracts.

---

## 6. General Journal (`/showtransections`)
- **Stitch Screen**: Project `18290502498789531250`, Screen `5d6f580796f14782af14a18106abf034` ("Smart Financial — General Journal")
- **Target File(s) Changed**:
  - `my-app/src/components/transactions/ShowTransactions.jsx`
  - `my-app/src/index.css` (added `.sf-gj-fb`, `.sf-gj-sp`, `.sf-gj-sm`, `.sf-gj-bal`, `.sf-gj-hdr`, `.sf-gj-v`, `.sf-gj-vm`, `.sf-gj-vn`, `.sf-gj-vd`, `.sf-gj-vb`, `.sf-gj-va`, `.sf-gj-ed`, `.sf-gj-dl`, `.sf-gj-cf`, `.sf-gj-acts`, `.sf-gj-gt`, `.sf-gj-es`)
- **New Shared Design Tokens & Styles**:
  - Filter Bar: `.sf-gj-fb` card with From/To date selectors, primary "View" CTA, "Print" action, and "Save as PDF" action with business branding note.
  - Telemetry Counter: `.sf-gj-sm` displaying transaction count and balanced debits/credits badge (`.sf-gj-bal`).
  - Desktop Column Header: `.sf-gj-hdr` with Transaction, Ledger, Debit, Credit, and Actions headings.
  - Transaction Voucher Articles: `.sf-gj-v` list with `#Voucher` display ID, date badge, double-entry layout (indented Credit accounts, debit/credit tabular amounts, and subtotal balanced row).
  - Actions & Inline Deletion: Direct edit navigation (`/transaction-edit/:id`) and inline disclosure confirmation card (`.sf-gj-cf`) with affected ledger list and recalculation reassurance.
  - Grand Total Bar: `.sf-gj-gt` lime banner with grand total sums for debits and credits.
  - Empty State: `.sf-gj-es` dashed container with "Show the last 30 days" quick action.
- **Logic & Functionality Preserved**:
  - API Fetch: `GET ${import.meta.env.VITE_BACKEND_URL}/api/showtransactions?from=${fromDate}&to=${toDate}&business_id=${business_id}`.
  - API Delete: `DELETE ${import.meta.env.VITE_BACKEND_URL}/api/delete-transaction/${id}?business_id=${business_id}` with state refresh.
  - PDF Generation: `jsPDF` with `autoTable`, business header, logo proxy (`/api/business/logo-proxy/:filename`), and table layout.
  - Print Workflow: Multi-voucher print window generator with custom stylesheet and logo loading.
  - Navigation: Edit transaction route `/transaction-edit/:id`.
  - Context & Refresh: `useBusiness()` hook integration and `triggerRefresh()`.
- **Skipped / Inert Stitch Elements**:
  - Checkbox CSS hack from static mockup replaced with clean React inline disclosure state (`confirmDeleteId`) for the delete confirmation card.
- **Decisions / Questions for User**:
  - None for General Journal. All filter ranges, print/PDF engines, and transaction operations behave identically.
- **Recent Refinements**:
  - Grand Total Bar: Replaced rigid 150px grid columns with a flexible, responsive container (`.sf-gj-gt-totals`, `.sf-gj-gt-item`, `.sf-gj-gt-lbl`, `.sf-gj-gt-val`) so Debit and Credit badges and amounts never overlap or truncate on any viewport.
  - Loading State & Flicker Elimination: Added `isLoading` state to `ShowTransactions.jsx` so "No entries in this range" never flickers before asynchronous date range results load. Added animated fetching indicator and disabled View/Export buttons while queries are in-flight.

---

## 7. Trial Balance (`/trial-balance`)
- **Stitch Screen**: Project `18290502498789531250`, Screen `a1f11390a7d24bdcaca7115af22909d5` ("Smart Financial — Trial Balance")
- **Target File(s) Changed**:
  - `my-app/src/components/reports/TrialBalance.jsx`
  - `my-app/src/index.css` (added `.sf-tb-wrap`, `.sf-tb-sheet`, `.sf-tb-rh`, `.sf-tb-tools`, `.sf-tb-sw`, `.sf-tb-hd`, `.sf-tb-gp`, `.sf-tb-gn`, `.sf-tb-cv`, `.sf-tb-sn`, `.sf-tb-table`, `.sf-tb-ln-lk`, `.sf-tb-ar`, `.sf-tb-tot`, `.sf-tb-tr1`, `.sf-tb-ok`, `.sf-tb-unbal`, `.sf-tb-bars`, `.sf-tb-trk`, `.sf-tb-nx`, `.sf-tb-bad`)
- **New Shared Design Tokens & Styles**:
  - Main Sheet: `.sf-tb-sheet` neo-brutalist white container with 2px ink border, 4px ink drop shadow, and centered business report header (`.sf-tb-rh`).
  - Interactive Filter Tools: `.sf-tb-tools` with neo-brutalist pill switch (`.sf-tb-sw`) to "Hide ledgers with no activity".
  - Standard Group Ordering: Category accordions (`details.sf-tb-gp`) for Assets, Liabilities, Equity, Income, and Expenses with rotating chevrons, count badges, and subtotal metrics.
  - Hover Interactions: Rows turn accent lime (`#C8F135`) on hover with sliding arrow indicator (`.sf-tb-ar`), linking directly to `/ledger-balancing`.
  - Zero-Value Formatting: Tabular numbers with dimmed `.z` styling (`#8A978F`) that illuminate on hover.
  - Grand Total Banner: `.sf-tb-tot` with prominent 30px totals, status badge (`Balanced` or `Out of balance`), and dual proportional progress tracks (`.sf-tb-trk`) visualizing debit and credit parity.
  - Suggested Reports: Neo-brutalist link cards (`.sf-tb-nx`) directing to Income Statement and Balance Sheet.
  - Diagnostic Alert: Out-of-balance diagnostic panel (`.sf-tb-bad`) in warm amber (`#F2B66B`) pointing directly to General Journal for discrepancy correction.
- **Logic & Functionality Preserved**:
  - API Fetch: `GET ${import.meta.env.VITE_BACKEND_URL}/api/ledger-balancing/${selectedBusiness.business_id}` with `withCredentials: true`.
  - Double-Entry Grouping: Accounting classification mapping (`getCategoryOrder`, `getCategoryName`) preserving exact double-entry category order.
  - Subtotal & Grand Total Aggregations: Dynamic sum of `total_debits` and `total_credits` for all category groups and the whole business.
  - Context & Refresh: `useBusiness()` hook integration and `refreshTrigger` reactivity.
  - Direct Ledger Navigation: Each ledger row links directly to `/ledger-balancing` passing `selectedLedger: account_id` state.
  - Print Support: Dedicated "Print statement" action.
- **Skipped / Inert Stitch Elements**:
  - Replaced static HTML checkboxes with React state (`hideZeroActivity`) for smooth, reactive zero-ledger filtering.
- **Decisions / Questions for User**:
  - None for Trial Balance. All calculations, groupings, links, and styling behave identically to Stitch specifications.
- **Recent Refinements**:
  - Total Sizing & Labeling: Reduced font size of totals from 30px to 18px and added explicit "Debit" and "Credit" pill labels.
  - Overlap Prevention: Converted `.sf-tb-tr1` and `.sf-tb-bars` to a responsive flex layout with dedicated items and auto-wrapping, guaranteeing that values and labels never collide across any screen width.
  - Cross-Page Ledger Navigation Fix: Fixed navigation from `ShowBusinessAccount` ("View Ledger Entries") and `TrialBalance` to pass complete `{ id, name }` state. Updated `LedgerBalancing.jsx` to dynamically resolve ledgers passed by ID, object, URL search query, or account name so the individual ledger T-Account entries and summary never render blank.

---

## 8. Ledger Balancing (`/ledger-balancing`)
- **Stitch Screen**: Project `4435387801083826442`, Screen `045cbc1ba9584c4aac1f746fe17dcb5e` ("Smart Financial — Ledger Balancing Screen")
- **Target File(s) Changed**:
  - `my-app/src/components/reports/LedgerBalancing.jsx`
  - `my-app/src/index.css` (added `.sf-lb-tot`, `.sf-lb-ok`, `.sf-lb-unbal`, `.sf-lb-sm`, `.sf-lb-hint`, `.sf-lb-lab`, `.sf-lb-bad`, `.sf-lb-bk`, `.sf-lb-chips`, `.sf-lb-cp`, `.sf-lb-hdb`, `.sf-lb-kp`, `.sf-lb-tsc`, `.sf-lb-ta`, `.sf-lb-dbl`, `.sf-lb-cbl`, `.sf-lb-how`, `.sf-lb-lk`)
- **New Shared Design Tokens & Styles**:
  - All Ledgers Summary:
    - `.sf-lb-tot`: Accent lime banner (`#C8F135`) with 2px ink border, 4px shadow, displaying Total Debits, Total Credits, and status badge (`.sf-lb-ok` "Balanced" or `.sf-lb-unbal` "Out of balance").
    - `.sf-lb-sm`: Neo-brutalist table with 2px ink border, uppercase headers (`LEDGER`, `TYPE`, `DEBITS ($)`, `CREDITS ($)`, `CLOSING`), and row hover state turning `#C8F135` with animated sliding arrow `→`.
    - `.sf-lb-bad`: Neo-brutalist warning panel in warm amber (`#F2B66B`) shown when total debits and credits do not balance.
  - Detail T-Account View:
    - `.sf-lb-chips`: Horizontal scrolling ledger switcher pill bar (`.sf-lb-cp`) allowing instant ledger switching without leaving the T-account sheet.
    - `.sf-lb-hdb` & `.sf-lb-kp`: Key performance indicator panel with Debits, Credits, and closing balance highlighted in lime.
    - `.sf-lb-ta`: Authentic two-sided T-Account table with Dr. (Debit) on the left (cols: Date, Particulars, Amount) and Cr. (Credit) on the right (cols: Date, Particulars, Amount), separated by a 3px ink vertical divider (`.bl`).
    - `.cd`: Balancing figure (`c/d (Balancing Figure)`) highlighted in `#C8F135` on the smaller side to balance the T-account.
    - `.sf-lb-dbl`: Double underline styling for matching footer totals.
    - `.sf-lb-how`: Collapsible neo-brutalist disclosure accordion explaining how to read a T-account (Dr., Cr., and c/d).
- **Logic & Functionality Preserved**:
  - Dynamic route & query param resolution: reads `location.state?.selectedLedger`, `?id=...`, `?name=...`, supporting `'all'`, `{ id, name }`, numeric IDs, and string names.
  - API Fetch: `GET ${apiUrl}/api/ledger-balancing/${business_id}` for all ledgers and `GET ${apiUrl}/api/ledger-balancing/${business_id}/${targetId}` for individual ledger details with `withCredentials: true`.
  - Name lookup fallback: automatically queries all ledgers to find `targetId` when only an account name is provided.
  - Calculations & formatting: `currency`, `formatClosing` (Dr/Cr tags), and `normalizeOppositeAccounts` for "To <Opposing Account>" / "By <Opposing Account>" strings.
  - Entry pairing: side-by-side row pairing with date formatting (`YYYY-MM-DD`), description preserving, and c/d balancing figure on the deficit side.
  - Context & refresh: `useBusiness()` hook integration and `refreshTrigger` reactivity.
- **Skipped / Inert Stitch Elements**:
  - CSS-only radio button hack (`<input type="radio" id="all" />`, `#l1`, etc.) from static Stitch HTML replaced with React state and `navigate()` handlers while preserving the exact visual chip states and table views.
- **Decisions / Questions for User**:
  - None for Ledger Balancing. Both the summary index view and individual T-account views match Stitch specifications exactly and preserve all logic.

