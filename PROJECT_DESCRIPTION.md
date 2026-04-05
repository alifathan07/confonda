# Confonda — General Project Description

Confonda is a web-based business management application focused on treasury and operational tracking for construction/contracting workflows. It centralizes day-to-day financial operations such as payments (règlements), received collections (encaissements), bank balances (soldes bancaires), and transfers (virements), with a dashboard-style UI built for fast filtering, pagination, and exporting to Excel/PDF.

The backend is built with Node.js/Express and follows a controller-based structure, using server-rendered views (EJS) for the admin dashboard and Prisma as the data access layer. The app manages key entities like users, suppliers, clients, chantiers (projects/sites), and banking records, providing history pages to audit transactions, compute totals, and update statuses. 

The project aims to give administrators a single source of truth for cashflow visibility, operational traceability, and reporting, while keeping the interface simple: toggleable sections, searchable tables, and consistent CRUD endpoints. It is designed to be extended with API endpoints (e.g., JWT for mobile clients) without breaking the existing session-based web authentication.
