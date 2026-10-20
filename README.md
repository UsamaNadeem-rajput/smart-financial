# Smart Financial (Sovereign Ledger)

An enterprise-grade, cloud-based double-entry accounting platform and financial intelligence engine. Designed for multi-business management, real-time ledger balancing, automated financial statement generation, and conversational natural language querying powered by an NLP-driven AI backend.

---

## 1. System Overview & Problem Statement

Traditional bookkeeping systems often require specialized accounting knowledge, rely on disconnected spreadsheets, or present complex manual workflows that are prone to balancing errors and data desynchronization.

**Smart Financial** solves this by enforcing formal double-entry accounting principles directly at the database and API layer while offering:
- Multi-tenant business vault isolation under a single user identity.
- Strict mathematical verification: Every financial transaction guarantees that $\sum \text{Debits} = \sum \text{Credits}$.
- Fully automated generation of the four fundamental financial statements: **General Journal**, **Ledger Balancing**, **Trial Balance**, **Income Statement (P&L)**, and **Balance Sheet**.
- PDF report export engine with cryptographic balance validation.
- An autonomous Natural Language Processing (NLP) intelligence service that translates plain-English queries into schema-aware SQL analytics.

---

## 2. Core Architecture & Technology Stack

The application is architected as a distributed 3-tier micro-service system:

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Frontend                        │
│            React + Vite + React Router + Axios              │
│       Session State, Context API & Route-Level Guarding     │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / JSON API
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway & Backend                    │
│            Node.js + Express + Express-Session              │
│     Bcrypt Auth, Connection Pooling, Transaction Guards     │
└───────────────┬─────────────────────────────┬───────────────┘
                │                             │
                │ Internal HTTP Bridge        │ MySQL Queries
                ▼                             ▼
┌───────────────────────────────┐ ┌───────────────────────────┐
│     AI Financial Service      │ │      Relational DB        │
│    Python + Flask + spaCy     │ │   MySQL 8.0 / MariaDB     │
│ Intent Parser & Query Builder │ │ Foreign Keys & ACID Trans │
└───────────────────────────────┘ └───────────────────────────┘
```

### Technology Matrix
- **Frontend Core**: React 18, React Router v6, Vite, Context API.
- **Backend API**: Node.js, Express, `express-session`, `express-mysql-session`, `bcrypt`, `mysql2` (connection pooling).
- **AI Intelligence Service**: Python 3.10+, Flask, spaCy (`en_core_web_sm`), Regex & Date Resolvers.
- **Database**: MySQL 8.0+ / MariaDB with strict relational integrity, foreign key constraints, and InnoDB transactions.
- **Document Generation**: jsPDF & `jspdf-autotable` for structured financial reporting.

---

## 3. Financial Mechanics & Business Logic

### A. Strict Double-Entry Engine
Every recorded financial event is treated as an atomic transaction containing two or more entries:
1. **Debit Entry**: Increases Assets and Expenses; Decreases Liabilities, Equity, and Revenue.
2. **Credit Entry**: Increases Liabilities, Equity, and Revenue; Decreases Assets and Expenses.
3. **Atomic Balance Verification**: Before committing to the database, the server computes:
   $$\sum \text{Debit Entries} - \sum \text{Credit Entries} = 0$$
   If this condition is violated by even a fraction of a cent, the entire transaction is rolled back and an error is returned.

### B. Chart of Accounts Hierarchy
Accounts are categorized under five fundamental accounting classifications:
- **Assets** (Cash, Accounts Receivable, Inventory, Equipment)
- **Liabilities** (Accounts Payable, Short-Term Loans, Accrued Expenses)
- **Equity** (Owner's Capital, Retained Earnings, Drawings)
- **Revenue / Income** (Sales, Service Fees, Operating Revenue)
- **Cost of Goods Sold (COGS) & Expenses** (Cost of Goods, Salaries, Rent, Utilities, Depreciation)

### C. Automated Financial Statement Pipeline
1. **General Journal**: Comprehensive chronological audit trail of all transactions and ledger postings. Includes soft-delete audit history where deleted entries are archived with timestamps and historical snapshots.
2. **Ledger Balancing (T-Accounts)**: Aggregates all activity per account, computing debit totals, credit totals, and dynamic carry-forward closing balances.
3. **Trial Balance**: Extracts closing balances from all active ledgers, demonstrating internal equilibrium between aggregate debits and aggregate credits.
4. **Income Statement (Profit & Loss)**:
   - Derives Gross Profit:
     $$\text{Gross Profit} = \text{Gross Revenue} - \text{Cost of Goods Sold (COGS)}$$
   - Derives Net Operating Income:
     $$\text{Net Income} = \text{Gross Profit} - \text{Operating Expenses (OPEX)}$$
5. **Balance Sheet**: Dynamically aggregates Assets, Liabilities, and Equity to verify the fundamental accounting equation:
   $$\text{Total Assets} = \text{Total Liabilities} + \text{Total Equity}$$

---

## 4. AI Financial Intelligence Engine

The platform includes an internal AI microservice residing in `ai_engine/` that enables users to query their financial records using plain English.

### Processing Pipeline:
1. **Natural Language Ingestion**: The user query is forwarded through the Express backend to the Flask service (`/generate-sql`).
2. **Linguistic & Named Entity Recognition (NER)**:
   - **spaCy** tokenizes the input, extracts grammatical tags, and parses financial verbs (e.g., *paid*, *spent*, *earned*, *received*, *bought*).
   - The date resolver detects temporal expressions (e.g., *last month*, *Q3*, *since January 15th*, *yesterday*) and normalizes them into ISO `YYYY-MM-DD` boundaries.
3. **Schema Mapping & Intent Classification**:
   - Matches referenced entities to known accounts in the user's active business (e.g., mapping *"utility bills"* to the *Utilities Expense* account).
   - Distinguishes between aggregate queries (*"total expenses this year"*), transaction lookups (*"recent payments to vendor"*), and balance inquiries (*"how much cash do we have left"*).
4. **Deterministic SQL Synthesis**:
   - Constructs parameterized, read-only SQL queries containing necessary `JOIN` and `GROUP BY` clauses.
   - Restricts data scope strictly to the active `business_id`.
5. **Execution & Answer Formulation**:
   - The query is executed safely and formatted into human-readable business insights.
   - Non-financial or ambiguous prompts are gracefully redirected without incurring arbitrary SQL execution.

---

## 5. Database Schema & Data Modeling

The relational database architecture is structured around strict data isolation per business:

```
users
  ├── id (PK, INT AUTO_INCREMENT)
  ├── username (VARCHAR)
  ├── email (VARCHAR, UNIQUE)
  ├── password_hash (VARCHAR)
  ├── is_verified (BOOLEAN)
  └── created_at (DATETIME)

businesses
  ├── business_id (PK, INT AUTO_INCREMENT)
  ├── user_id (FK -> users.id)
  ├── business_name (VARCHAR)
  ├── business_type (VARCHAR)
  └── created_at (DATETIME)

accounts
  ├── account_id (PK, INT AUTO_INCREMENT)
  ├── business_id (FK -> businesses.business_id)
  ├── account_name (VARCHAR)
  ├── account_type_id (FK -> account_types.id)
  └── created_at (DATETIME)

transactions
  ├── transaction_id (PK, INT AUTO_INCREMENT)
  ├── business_id (FK -> businesses.business_id)
  ├── transaction_date (DATE)
  ├── description (TEXT)
  ├── total_amount (DECIMAL(15,2))
  └── is_deleted (BOOLEAN)

transaction_entries
  ├── entry_id (PK, INT AUTO_INCREMENT)
  ├── transaction_id (FK -> transactions.transaction_id)
  ├── account_id (FK -> accounts.account_id)
  ├── debit (DECIMAL(15,2))
  ├── credit (DECIMAL(15,2))
  └── type (ENUM('debit', 'credit'))
```

---

## 6. Security, Authentication & Data Protection

- **Password Security**: Password storage utilizes cryptographic salting and hashing via `bcrypt`.
- **Session-Based Isolation**: Sessions are managed server-side with MySQL session storage, configured with `httpOnly`, `secure`, and `sameSite` flags.
- **SQL Injection Prevention**: All queries across all routers strictly utilize parameterized statements (`conn.query('... ?', [values])`). Raw string interpolation in queries is prohibited.
- **Tenant Isolation**: Every financial query mandates an explicit `WHERE business_id = ?` clause verified against the authenticated user's ownership records to prevent cross-tenant data leakage.
- **Audit Trails**: Destructive actions (such as transaction removals) maintain historical logs in the database to prevent untracked balance tampering.

---

## 7. API Reference Overview

### Authentication & Account Management
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/register` | Register new user account |
| `POST` | `/api/login` | Authenticate user credentials & initiate session |
| `GET` | `/api/login/session` | Validate active session & return user metadata |
| `GET` | `/api/auth/logout` | Invalidate active session & clear session store |
| `POST` | `/api/auth/forgot-password` | Request password reset token |

### Business Vault Operations
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/showbusinesses` | List all business vaults belonging to the authenticated user |
| `POST` | `/api/business` | Create a new business vault |
| `GET` | `/api/accounts/:business_id` | Fetch Chart of Accounts for specified business |
| `POST` | `/api/createnewaccount` | Create an individual ledger account under a classification |

### Transactions & Accounting
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/showtransactions/:business_id` | Fetch chronological General Journal entries |
| `POST` | `/api/transections` | Post a balanced double-entry transaction |
| `PUT` | `/api/edittransaction/:id` | Edit and rebalance an existing transaction |
| `DELETE` | `/api/deletetransaction/:id` | Soft-delete a transaction and write to historical audit record |

### Financial Statements & Reports
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/ledger-balancing/:business_id` | Generate T-Account summaries and closing balances |
| `GET` | `/api/trial-balance/:business_id` | Generate debit/credit Trial Balance |
| `GET` | `/api/income-report/:business_id` | Generate Income Statement (Revenue, COGS, OPEX, Net Profit) |
| `GET` | `/api/balance-sheet/:business_id` | Generate Balance Sheet (Assets, Liabilities, Equity) |

### AI NLP Analytics
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/ai/chat` | Proxy conversational prompt to NLP engine & return analysis |

---

## 8. Installation & Setup Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Python**: v3.10 or higher
- **MySQL**: v8.0 or higher / MariaDB
- **npm** or **yarn**

### Step 1: Clone Repository
```bash
git clone https://github.com/UsamaNadeem-rajput/smart_financial.git
cd smart_financial
```

### Step 2: Database Setup
1. Create a MySQL database (e.g., `smart_financial_db`).
2. Import the schema tables into your database.

### Step 3: Backend API Setup (`server/`)
```bash
cd server
npm install
```
Create a `.env` file in `server/`:
```env
PORT=8080
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=smart_financial_db
SESSION_SECRET=your_super_secret_session_key
FRONTEND_URL=http://localhost:5173
```
Start the backend server:
```bash
npm start
```

### Step 4: AI Engine Setup (`ai_engine/`)
```bash
cd ../ai_engine
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python -m spacy download en_core_web_sm
python app.py
```

### Step 5: Frontend Application (`my-app/`)
```bash
cd ../my-app
npm install
```
Create a `.env` file in `my-app/`:
```env
VITE_BACKEND_URL=http://localhost:8080
```
Start the frontend development server:
```bash
npm run dev
```

---

## 9. Verification & Testing

To verify the complete frontend build:
```bash
cd my-app
npm run build
```
This compiles production-ready bundles with full route-level code splitting and zero syntax/compilation errors.

---

## 10. Authors & License

- **Developer**: Usama Nadeem ([@UsamaNadeem-rajput](https://github.com/UsamaNadeem-rajput))
- **Project**: Smart Financial — Cloud Accounting & Financial Intelligence Platform
- **License**: Proprietary / All Rights Reserved
