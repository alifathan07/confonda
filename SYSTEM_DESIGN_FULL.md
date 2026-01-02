# Confonda — System Design, Architecture, and Full App Explanation (Step-by-Step)

## 0) What this application is
**Confonda** is a web-based ERP oriented for construction companies.
It covers:
- Treasury (Trésorerie): banks, cheques, effets, transfers, situations
- Purchasing (Achats): suppliers, purchase requests, quote requests, purchase orders
- Sales/Operations (Ventes/Chantiers): clients, chantiers (projects), encaissements
- Cash management (Caisse): requests, justifications, expenses/receipts
- User management + role-based access (grandadmin/admin/user)

This is primarily a **server-rendered web app** (EJS templates) with an Express backend.

---

## 1) Technology stack (what is used and why)
### 1.1 Backend
- **Node.js** runtime
- **Express.js** web framework (`express`)
- **Prisma ORM** (`@prisma/client`, `prisma`) for database queries and schema management
- **Database**: **MySQL** (Prisma datasource is `mysql` with `DATABASE_URL`)
- **Auth**: **session-based authentication**
  - `express-session` for session cookies
  - `express-mysql-session` for persisting sessions in MySQL
  - `bcryptjs` for password hashing
- **File uploads**: `multer`
- **PDF generation**: `pdfkit` (+ also Puppeteer exists as dependency)
- **Excel import/export**: `exceljs`, `xlsx`
- **Email**: `nodemailer`
- **Other utilities**: `method-override` for PATCH/DELETE via HTML forms

### 1.2 Frontend
- **EJS** templates (`views/`) for server-side rendering
- **AdminLTE** for admin dashboard UI styling (`admin-lte`)
- **Static assets** in `public/`
- **Uploads** stored locally in `uploads/` (also exposed via a static route)

### 1.3 Architectural style
- **MVC** (Model–View–Controller)
  - **Models** are effectively your Prisma schema + Prisma client
  - **Controllers** contain business logic and DB operations
  - **Views** are EJS pages and partials
  - **Routes** map HTTP endpoints to controller handlers

---

## 2) Repository structure (how to navigate it)
Key locations:
- **`index.js`**: main server entry point (Express app initialization)
- **`routes/`**: routers
  - `auth.js`: login/register/logout endpoints
  - `dashboard.js`: the majority of ERP routes (protected)
- **`controllers/`**: business modules (treasury/purchasing/cash/etc.)
- **`middlewares/auth.js`**: authentication + role guards
- **`prisma/schema.prisma`**: DB schema
- **`db.js`**: Prisma client instance export
- **`views/`**: EJS templates
- **`public/`**: static assets (AdminLTE, css/js, images)
- **`uploads/`**: user uploaded files (receipts/images/etc.)

---

## 3) Step-by-step runtime: what happens when the app starts
### 3.1 Entry point (`index.js`)
When you run `node index.js`:
1. Express app is created.
2. Middleware setup:
   - `express.urlencoded` + `express.json` for parsing request bodies
   - `method-override("_method")` to support PATCH/DELETE from forms
3. View engine setup:
   - `app.set('view engine', 'ejs')`
   - `app.set('views', path.join(__dirname, 'views'))`
4. Static hosting:
   - `public/` served as static files
   - `/uploads` served as static files from `uploads/`
5. Session store:
   - A MySQL-backed session store is initialized (`express-mysql-session`)
   - Session cookie configured (2 hours, `httpOnly`, `secure: false`)
6. Routers mounted:
   - `authRouter` (public auth endpoints)
   - `dashboardRouter` (ERP endpoints; guarded by auth middleware)
7. Server listens on `PORT` (default 3000)

### 3.2 The request lifecycle (high-level)
For a typical authenticated ERP page:
1. Browser makes HTTP request
2. Express router matches a route in `routes/dashboard.js`
3. The router ensures `isAuthenticated` passes
4. Controller executes business logic:
   - reads/writes MySQL through Prisma
   - optionally reads/writes files (uploads, PDFs)
   - computes totals/statuses
5. Controller renders an EJS view with data
6. EJS returns HTML to the browser

---

## 4) Authentication & authorization design
### 4.1 Session-based auth
- Login typically sets something like `req.session.user = { ... }` in the auth controller.
- The session is persisted in MySQL (so it survives restarts).

### 4.2 Guards (`middlewares/auth.js`)
- `isAuthenticated`: if no session user, redirect to `/` (login)
- `redirectIfLoggedIn`: if already logged in, redirect to `/dashboard`
- `isAdmin`, `isGrandAdmin`, `isUser`: role checks

### 4.3 Router-level protection
`routes/dashboard.js` applies:
- `dashboardRouter.use(isAuthenticated)`
So *everything under dashboard router is protected by default*.

---

## 5) Database design (Prisma + MySQL)
### 5.1 Source of truth
The canonical schema is `prisma/schema.prisma`.
- MySQL connection comes from `DATABASE_URL` env var.

### 5.2 Main domain entities (based on schema)
- **Users & roles**: `User` with `role` (`user|admin|grandadmin`) + belongs to a `Chantier`
- **Purchasing / documents**:
  - `DemandeFourniture` + `ItemFourniture`
  - `DemandeCaisse` + `ItemCaisse`
  - `JustifCaisse`, `DepenseCaisse`, `RecetteCaisse`
  - Suppliers: `Fournisseur` + `Attestation`
- **Treasury**:
  - `Banque`, `Cheque`, `Effet`
  - `Virement`, `Payavenir`, `Recavenir` (and related)
- **Operations/Sales**:
  - `Client`, `Chantier`, `Encaissement` (and related)

### 5.3 How data access is done
- Controllers import the Prisma client from `db.js` (or instantiate Prisma in `index.js` for specific endpoints)
- Queries are Prisma methods like `findMany`, `findUnique`, `create`, `update`, `delete`, often with `include`.

---

## 6) Application modules (how features are split)
The app is split by domain area, mostly at the **controller** level:

### 6.1 Treasury (Trésorerie)
Typical responsibilities:
- Create/update banks and compute balances
- Track cheques/effets life cycle (in circulation, paid, unpaid)
- Track upcoming payments/receipts (payavenir/recavenir)
- Generate PDFs for transfers / mise à disposition

Where to look:
- `controllers/banquesController.js`
- `controllers/chequesController.js`
- `controllers/effetsController.js`
- `controllers/virementController.js`
- `controllers/misediscontrollrt.js`
- Routes in `routes/dashboard.js` under `/tresorerie/...`

### 6.2 Purchasing (Achats)
Typical responsibilities:
- CRUD suppliers + supplier attestations
- Material requests (demande fourniture) + item validation + images
- Quote requests (demande de prix) + send email + PDF
- Purchase orders (bon de commande) + PDF + email

Where to look:
- `controllers/supplierController.js`
- `controllers/demandeFourniture.js`
- `controllers/demandeprixController.js`
- `controllers/bcController.js`
- Routes in `routes/dashboard.js` under `/achats/...`

### 6.3 Cash management (Caisse)
Typical responsibilities:
- Create cash request (demande caisse), validate items
- Create monthly justifications (justif caisse) and validate expenses
- Export to Excel/PDF

Where to look:
- `controllers/demandecaisseController.js`
- `controllers/justifecaisseController.js`

### 6.4 Clients / Chantiers / Encaissements
Typical responsibilities:
- CRUD clients
- Manage chantiers and attach them to clients
- Track money received (encaissements)

Where to look:
- `controllers/clientController.js`
- `controllers/chantierController.js`
- `controllers/encaisementController.js`

---

## 7) File storage & document generation design
### 7.1 Uploads
- `multer` is used for uploads
- Files end up under `uploads/` (and sometimes `public/uploads` depending on route usage)
- App exposes `/uploads` as a static directory

### 7.2 PDFs
There are multiple PDF generation paths:
- **PDFKit** for programmatic PDF creation
- **Puppeteer** exists as a dependency (often used to print HTML-to-PDF)

Where to look:
- `controllers/virementController.js` (ex: `generateVirementPDF`)
- `controllers/misediscontrollrt.js` (ex: `generateMiseadisPDF`)
- `controllers/bcController.js` (ex: `generateBcPDF`)

---

## 8) Routing architecture (how HTTP endpoints are organized)
### 8.1 Public routes
- `/` renders the login page
- `/login`, `/register`, `/logout`
- `/public/bc/:id?sig=...` renders a public purchase order view (signed link)

### 8.2 Protected dashboard routes
Mounted via `dashboardRouter` and guarded by `isAuthenticated`:
- `/dashboard`
- `/achats/...`
- `/tresorerie/...`
- and many other domain endpoints

Design note: the router file (`routes/dashboard.js`) currently contains a **large monolithic route table** importing many controllers.

---

## 9) Deployment model (current)
Current code implies a **single-node deployment**:
- Express server + EJS rendering + Prisma connected to MySQL
- Local disk is used for uploads (stateful)

A typical production setup would be:
- Reverse proxy (Nginx) in front
- Node process managed by PM2
- MySQL on a managed service or dedicated VM

---

## 10) Cross-cutting concerns (what exists today)
- **Authorization**: roles are checked via middleware
- **Sessions**: stored in MySQL
- **Data access**: Prisma
- **Observability**: mostly `console.error` logging today
- **Configuration**:
  - DB URL is from env (`DATABASE_URL`)
  - Some secrets are hardcoded in code (needs improvement)

---

# Best Next Steps (System Design / Architecture Improvements)
Below are the most impactful next steps, ordered by value and risk reduction.

## 1) Fix configuration & secrets management (high priority)
- **Move hardcoded secrets to env vars** (example: session secret `phpvsnodejs`, `PUBLIC_BC_SECRET`).
- Use `.env.example` (or update it) to document required variables.
- Use different values per environment (dev/staging/prod).

## 2) Split the monolithic dashboard router (high priority)
`routes/dashboard.js` is very large and imports many controllers.
- Break it into multiple routers by domain:
  - `routes/treasury/*`
  - `routes/purchasing/*`
  - `routes/cash/*`
  - `routes/projects/*`
- This improves maintainability, reduces merge conflicts, and makes permissions easier.

## 3) Introduce a service layer (high priority)
Right now controllers tend to own both HTTP + business logic.
- Add `services/` where you place:
  - computations (totals, statuses)
  - document generation helpers
  - validation rules
- Controllers become thin: parse request → call service → render.

## 4) Standardize authorization rules (medium/high)
- Centralize role permissions per module (RBAC policy map).
- Avoid redirect-based authorization for API-like endpoints (prefer `403` for XHR, redirects only for browser pages).

## 5) Add input validation (medium/high)
- Add validation for request bodies and params (e.g. Zod / Joi).
- Prevent invalid data from reaching Prisma.

## 6) Improve observability (medium)
- Use a structured logger (pino/winston).
- Add request IDs and audit logs for important actions (payments, approvals).
- Add error boundary middleware to format errors consistently.

## 7) Prepare for scale (optional, depends on your goals)
If you plan multiple servers:
- Uploads should move to object storage (S3-compatible), not local disk.
- Use a dedicated cache (Redis) for sessions instead of MySQL sessions.
- Separate background jobs (email sending, heavy PDF generation) to a queue (BullMQ).

---

## Appendix: Key entry points
- Server: `index.js`
- Prisma client: `db.js`
- Routers: `routes/auth.js`, `routes/dashboard.js`
- Auth middleware: `middlewares/auth.js`
- DB schema: `prisma/schema.prisma`
