# Confonda - Technical Description

## 1. Project Overview
**Confonda** is a comprehensive web-based ERP (Enterprise Resource Planning) system designed for construction management. It handles various aspects of business operations including Treasury (Trésorerie), Purchasing (Achats), Sales (Ventes), and Project Management (Chantiers).

## 2. Technology Stack

### Backend
-   **Runtime:** Node.js
-   **Framework:** Express.js (v5.1.0)
-   **Database ORM:** Prisma Client (@prisma/client v6.14.0)
-   **Database:** MySQL
-   **Authentication:** 
    -   Session-based authentication (`express-session`, `express-mysql-session`)
    -   Password hashing with `bcryptjs`
-   **File Handling:** `multer` for file uploads
-   **PDF Generation:** `pdfkit`
-   **Excel Processing:** `exceljs`, `xlsx`
-   **Utilities:** `nodemailer` (email), `puppeteer` (headless browser automation), `gradient-string` (console styling)

### Frontend
-   **Templating Engine:** EJS (Embedded JavaScript)
-   **UI Framework:** AdminLTE (Bootstrap-based admin dashboard template)
-   **Styling:** CSS, Bootstrap (via AdminLTE)

## 3. Architecture
The application follows the **MVC (Model-View-Controller)** architectural pattern:

-   **Models (`prisma/schema.prisma`):** Defines the database schema and relationships using Prisma.
-   **Views (`views/`):** Contains EJS templates for rendering the user interface.
-   **Controllers (`controllers/`):** Contains the business logic, handling requests, interacting with the database, and rendering views.
-   **Routes (`routes/`):** Defines the application endpoints and maps them to controller functions.
-   **Middlewares (`middlewares/`):** Handles authentication (`auth.js`) and other request processing.

## 4. Key Modules & Features

### 4.1. Dashboard
-   Provides a high-level overview of the company's financial health.
-   Displays bank balances, upcoming payments (cheques, effets), and expected receipts.
-   Visualizes data using charts.

### 4.2. Trésorerie (Treasury)
-   **Banques:** Management of bank accounts and balances.
-   **Cheques & Effets:** Tracking of issued checks and promissory notes, including their status (circulation, paid, unpaid).
-   **Virements & Mise à Disposition:** Management of bank transfers and cash availability.
-   **Payavenir & Recavenir:** Tracking of future payments and receipts.
-   **Situation Bancaire:** Real-time view of the financial situation.

### 4.3. Achats (Purchasing)
-   **Fournisseurs:** Supplier management database.
-   **Demande de Fourniture:** Internal requests for materials/supplies.
-   **Demande de Prix:** Requests for quotes from suppliers.
-   **Bon de Commande:** Generation and management of purchase orders.
-   **Caisse:** Petty cash management (requests, justifications, expenses, receipts).

### 4.4. Ventes (Sales)
-   **Clients:** Customer management.
-   **Chantiers:** Construction site management, linked to clients.
-   **Encaissement:** Tracking of payments received from clients.

### 4.5. User Management
-   Role-based access control (GrandAdmin, Admin, User).
-   User CRUD operations.

## 5. Database Schema Highlights
-   **Core Entities:** `User`, `Chantier`, `Client`, `Fournisseur`, `Banque`.
-   **Financial Entities:** `Cheque`, `Effet`, `Virement`, `Miseadis`, `Payavenir`, `Recavenir`.
-   **Document Entities:** `DemandeFourniture`, `DemandeDePrix`, `BondeCommande`, `JustifCaisse`.
-   **Relationships:** Extensive use of relations (e.g., `Chantier` linked to `Client`, `Cheque` linked to `Banque` and `Fournisseur`).

## 6. Setup & Installation
1.  **Install Dependencies:** `npm install`
2.  **Database Setup:**
    -   Ensure MySQL is running.
    -   Configure `.env` with `DATABASE_URL`.
    -   Run migrations: `npx prisma migrate dev`
    -   (Optional) Seed database: `npm run prisma:seed`
3.  **Run Application:**
    -   Development: `npm run nodemon` (if script exists) or `npx nodemon index.js`
    -   Production: `node index.js`
