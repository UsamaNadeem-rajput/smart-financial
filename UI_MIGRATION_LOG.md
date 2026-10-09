# UI Migration Log (Stitch Redesign)

Branch: `ui-stitch-migration`

---

## 1. Landing Page (`/`)
- **Stitch Screen**: Project `1850777105332051393`, Screen `c3590519542b45f69a954f431cbc3fbe` ("Ledgerly — Real-Time Insights & Financial Command")
- **Target File(s) Changed**:
  - `my-app/src/components/landing/LandingPage.jsx`
  - `my-app/index.html` (added Inter Google Font and brand title)
  - `my-app/tailwind.config.js` (added `brand` palette, `4xl`/`5xl` border radii)
  - `my-app/src/index.css` (added `.step-num-outline` stroke, `.scrollbar-none`)
- **New Shared Design Tokens & Styles**:
  - Palette: `brand.lime` (`#D8F929`), `brand['lime-hover']` (`#C8E920`), `brand.dark` (`#111315`), `brand.darkCard` (`#181B1E`), `brand.darkBubble` (`#1F2428`), `brand.charcoal` (`#0D0F11`), `brand.muted` (`#6B7280`), `brand.border` (`#E5E7EB`), `brand.surface` (`#FBFBFB`).
  - Typography: `font-sans` with `Inter`.
  - Border Radii: `rounded-4xl` (`2rem`), `rounded-5xl` (`2.5rem`).
  - Utilities: `.step-num-outline` (outlined giant numbers), `.scrollbar-none`.
- **Logic & Functionality Preserved**:
  - Session endpoint check: `GET ${import.meta.env.VITE_BACKEND_URL}/api/login/session` with `withCredentials: true`.
  - Firebase visitor count transaction (`site_stats/visitors`).
  - Firebase live stats synchronization (`site_stats`).
  - Firebase global click interaction tracking (`site_stats/clicks`) with 1-second debounce.
  - Logout handler: `GET ${import.meta.env.VITE_BACKEND_URL}/api/auth/logout` with `withCredentials: true`, localStorage clearing, redirection to `/login`.
  - Conditional rendering: Authenticated user menu (`Welcome, {user}`, `Dashboard` linking to `/list`, `Logout`, `/profile`) vs Guest menu (`Log in` linking to `/login`, `Start free` linking to `/register`).
  - Mobile menu toggle state and drawer (`isMobileMenuOpen`).
  - Real metric bindings: `stats.visitors.toLocaleString()` and `stats.clicks.toLocaleString()` bound directly into the FinFlow Telemetry Bento cards.
- **Skipped / Inert Stitch Elements**:
  - "Watch 2-min demo" / "Meet the assistant" / "Book a demo": Smooth-scrolling anchor to `#demo` / `#insights` (no video demo modal exists in current app).
  - "Review" / "Later" buttons in the floating AI suggestion card: Rendered inert (visual demonstration of AI suggestions).
  - Pricing plan buttons ("Choose Starter", "Choose Growth", "Talk to us"): Wired to `/register` or `/list` based on auth state (the backend currently has no separate plan checkout endpoint).
- **Decisions / Questions for User**:
  - Content and branding replaced Stitch's generic "Ledgerly" placeholder text with real Smart Financial AI project information: `/final.png` logo, Multi-Business Management, Double-Entry journals, Chart of Accounts, Trial Balance, Income Statement, Balance Sheet, and Roman Urdu / English AI financial copilot.
  - All styling, layout, responsive behavior, and Stitch design fidelity remain 100% matched.

