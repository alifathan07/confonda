# Confonda — General Project Description

Confonda is a comprehensive web-based business management application designed for construction/contracting companies. It provides centralized treasury management, operational tracking, and financial reporting with a modern dashboard-style interface.

## Overview

Confonda is a web-based business management application focused on treasury and operational tracking for construction/contracting workflows. It centralizes day-to-day financial operations such as payments (règlements), received collections (encaissements), bank balances (soldes bancaires), and transfers (virements), with a dashboard-style UI built for fast filtering, pagination, and exporting to Excel/PDF.

## Core Features

### Treasury Management (Trésorerie)
- **Bank Management** - Track multiple bank accounts with real-time balances
- **Cheques** - Manage cheque payments with import from Excel, PDF generation (BMCE, BMCI, AWB, Credit Agricole, CDM, BP formats), validation workflow, and export capabilities
- **Effects (Effets)** - Handle bills of exchange with allocation to invoices/fournisseurs
- **Virements (Transfers)** - Record and manage bank transfers between accounts
- **Mise à Disposition** - Track disbursements with PDF generation
- **Payavenir** - Future payment planning and tracking
- **Recettes à Venir** - Future revenue/collection forecasting
- **Situation Bancaire** - Real-time banking situation overview

### Procurement (Achats)
- **Fournisseurs (Suppliers)** - Full supplier management with contact details, attestation uploads
- **Bons de Commande (BC)** - Purchase order management linked to suppliers
- **Bons de Livraison (BL)** - Delivery notes linked to BCs with article tracking
- **Fourniture** - Supply/equipment management

### Sales (Ventes)
- **Clients** - Customer management with contact information
- **Chantiers (Projects/Sites)** - Project management linked to clients with budget tracking
- **Devis (Quotes)** - Quote generation and management
- **Factures** - Invoice generation from BLs with TVA calculation

### User Management
- **Authentication** - Session-based login with role-based access control
- **Roles** - User, Admin, Developer, Grand Admin
- **User Management** - Create, edit, delete users (admin only)

### Reporting & Export
- **Excel Export** - Export data to spreadsheets for further analysis
- **PDF Generation** - Generate professional PDF documents (cheques, effets, virements, mises à disposition)
- **Dashboard** - Overview with key metrics and quick access to all modules

### Additional Features
- **Bug Reporting** - Internal issue tracking system
- **Popup Notifications** - System-wide announcements for users
- **Email Notifications** - Automated email alerts for important events
- **Telegram Bot** - Integration for real-time notifications to administrator

## Technical Stack

- **Backend**: Node.js with Express.js
- **Database**: MySQL with Prisma ORM
- **Frontend**: EJS templates with Bootstrap, jQuery, DataTables
- **Authentication**: Session-based with express-session
- **File Handling**: Multer for uploads
- **PDF Generation**: PDFKit
- **Excel Export**: ExcelJS

## Architecture

The application follows a controller-based MVC pattern:
- **Routes** - Request routing and middleware
- **Controllers** - Business logic
- **Views** - EJS templates
- **Prisma** - Database access layer

## API Support

The project includes RESTful API endpoints supporting:
- JWT authentication for mobile clients
- CRUD operations for key entities
- Integration with external systems

The project aims to give administrators a single source of truth for cashflow visibility, operational traceability, and reporting, while keeping the interface simple: toggleable sections, searchable tables, and consistent CRUD endpoints. It is designed to be extended with API endpoints (e.g., JWT for mobile clients) without breaking the existing session-based web authentication.
