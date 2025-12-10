# Software Development Life Cycle (SDLC) - Confonda Project

This document outlines the Software Development Life Cycle (SDLC) for the **Confonda** project, a web-based ERP system for construction management. It defines the processes for planning, designing, developing, testing, deploying, and maintaining the application.

## 1. Planning & Requirements Analysis
**Goal:** Define the scope and objectives of new features or enhancements.
-   **Requirement Gathering:** Collect requirements from stakeholders (e.g., construction managers, accountants) regarding Treasury, Purchasing, Sales, and Project Management needs.
-   **Feasibility Study:** Analyze technical feasibility using the current stack (Node.js, Express, MySQL).
-   **Task Breakdown:** Break down requirements into actionable tasks (e.g., "Add 'Bon de Commande' generation", "Fix Supplier Autocomplete").
-   **Tools:** Project management tools (e.g., Trello, Jira, or simple Markdown task lists).

## 2. System Design
**Goal:** Architect the solution to meet requirements.
-   **Architecture:** Follow the **MVC (Model-View-Controller)** pattern.
    -   **Models:** Define data structures in `prisma/schema.prisma`.
    -   **Views:** Design UI layouts using EJS and AdminLTE templates in `views/`.
    -   **Controllers:** Implement business logic in `controllers/`.
-   **Database Design:**
    -   Update the schema in `prisma/schema.prisma`.
    -   Ensure relationships (e.g., `Chantier` -> `Client`) are correctly defined.
-   **API Design:** Define routes in `routes/` mapping to controller functions.

## 3. Implementation (Development)
**Goal:** Write clean, maintainable, and efficient code.
-   **Environment Setup:**
    -   Install dependencies: `npm install`.
    -   Configure environment variables in `.env`.
-   **Coding Standards:**
    -   **Backend:** Node.js/Express best practices. Async/Await for database operations.
    -   **Frontend:** EJS for server-side rendering. Keep logic minimal in views.
    -   **Styling:** Use Bootstrap classes (AdminLTE) to maintain UI consistency.
-   **Version Control:**
    -   Use Git for source code management.
    -   Commit messages should be descriptive (e.g., "feat: add supplier autocomplete", "fix: pdf generation layout").

## 4. Testing
**Goal:** Ensure the application is bug-free and reliable.
-   **Unit Testing:**
    -   Write tests for critical logic (e.g., calculation of totals, PDF generation helpers).
    -   *Current Status:* Basic testing files exist (`index.spec`). Expand as needed.
-   **Integration Testing:**
    -   Verify interactions between Controllers and Database (Prisma).
    -   Test API endpoints using tools like Postman or automated scripts.
-   **User Interface (UI) Testing:**
    -   Verify EJS templates render correctly across devices.
    -   Test interactive elements (forms, buttons, charts).
-   **Manual Testing:**
    -   Perform end-to-end workflows (e.g., Create a Purchase Order -> Approve -> Generate PDF).

## 5. Deployment
**Goal:** Release the application to the production environment.
-   **Pre-Deployment:**
    -   Run database migrations: `npx prisma migrate deploy`.
    -   Build static assets if necessary.
-   **Deployment Steps:**
    -   Pull latest code from the repository.
    -   Install production dependencies: `npm ci --only=production`.
    -   Start the application using a process manager (e.g., PM2): `pm2 start index.js`.
-   **Environment:** Ensure the production server has Node.js, MySQL, and necessary system libraries (for Puppeteer/PDF generation) installed.

## 6. Maintenance
**Goal:** Keep the system running smoothly and improve it over time.
-   **Monitoring:** Monitor server logs (PM2 logs) for errors.
-   **Bug Fixes:** Address issues reported by users (e.g., "PDF UI broken").
-   **Updates:**
    -   Regularly update dependencies (`npm update`) to patch security vulnerabilities.
    -   Refactor code for performance optimization.
-   **Backups:** Schedule regular database backups (MySQL dumps).

---
**Document Version:** 1.0
**Last Updated:** 2025-12-04
