# Confonda ERP - Complete Feature Documentation

## Overview
Confonda is a comprehensive ERP system for managing purchases, treasury, sales, and company operations. This document describes all features organized by module.

---

## 1. ACHATS (Purchases Module)

### 1.1 Bon de Commande (BC - Purchase Orders)
- **Create BC**: Create new purchase orders with items
- **List BC**: View all purchase orders with filtering
- **Edit BC**: Modify existing purchase orders
- **Delete BC**: Remove purchase orders
- **Update BC Items**: Add/remove/update items in purchase orders
- **Link to Demandes**: Link BCs to demande fourniture
- **Generate PDF**: Export BC as PDF
- **Send Email**: Send BC via email
- **Dashboard**: BC-specific dashboard with statistics
- **Import BC Info**: Import information from other sources
- **Update Supplier**: Update supplier information
- **Get Articles Remaining**: View remaining articles for BC
- **Affecter BL**: Link BL (Bon de Livraison) to BC
- **Get BC Dashboard**: View BC-specific dashboard data

### 1.2 Bon de Livraison (BL - Delivery Notes)
- **Create BL**: Create delivery notes
- **List BL**: View all delivery notes
- **Edit BL**: Modify delivery notes
- **Update BL**: Update delivery note details
- **Delete BL**: Remove delivery notes
- **View BL**: View delivery note details
- **Affecter BC**: Link BL to BC
- **Upload BL File**: Upload delivery note documents
- **Download BL File**: Download delivery note documents
- **Search BLs**: Search delivery notes
- **Get BL Articles**: Get articles from delivery notes
- **Affecter BC to BL**: Link BC to BL
- **View Facture**: View related invoices
- **View Facture Avoir**: View credit notes
- **Get BL**: Get specific delivery note

### 1.3 Factures (Invoices)
- **List Factures**: View all invoices
- **Get Facture**: Get specific invoice details
- **Create Facture**: Create new invoices
- **Update Facture**: Modify invoices
- **Delete Facture**: Remove invoices
- **Affecter BL to Facture**: Link BL to invoice
- **List Facture Avoirs**: View credit notes
- **Create Facture Avoir**: Create credit notes
- **Delete Facture Avoir**: Remove credit notes
- **Affecter BL to Facture Avoir**: Link BL to credit note
- **Get Factures By Fournisseur**: Get invoices by supplier
- **Get Facture Avoirs By Fournisseur**: Get credit notes by supplier
- **Get Facture Avoirs By Facture**: Get credit notes for specific invoice
- **Get Facture Avoir**: Get specific credit note
- **Get BL Facture Status**: Check BL invoice status
- **Upload Facture File**: Upload invoice documents
- **Download Facture File**: Download invoice documents
- **Upload Facture File Multer**: Upload multiple invoice files
- **Get Facture Reglements**: Get invoice payments
- **Search Reglements**: Search payments
- **Affecter Reglement**: Link payment to invoice

### 1.4 Fournisseurs (Suppliers)
- **List Fournisseurs**: View all suppliers
- **Create Fournisseur**: Add new supplier
- **Post Fournisseur**: Submit supplier data
- **Update Fournisseur**: Modify supplier information
- **Delete Fournisseur**: Remove supplier
- **Index Clients**: View client/supplier index
- **Post Client**: Submit client/supplier data
- **Update Client**: Modify client/supplier
- **Destroy Client**: Remove client/supplier

### 1.5 Fourniture (Supplies/Materials)
- **Create Fourniture**: Add new supply/material
- **Post Fourniture**: Submit supply data
- **List Fourniture**: View all supplies
- **Update Fourniture**: Modify supply information
- **Delete Fourniture**: Remove supply
- **Upload Image**: Upload supply images
- **Download Image**: Download supply images

### 1.6 Caisse (Cash Management)
- **Create Demande Caisse**: Create cash request
- **Index Demande Caisse**: View cash requests
- **Store Demande Caisse**: Submit cash request
- **View Demande Caisse**: View cash request details
- **Update Demande Caisse**: Modify cash request
- **Delete Demande Caisse**: Remove cash request
- **Delete Demande Caisse Item**: Remove item from cash request
- **Update Demande Caisse Item**: Modify cash request item
- **Update Demande Caisse Item Validation**: Validate cash request item
- **Update Demande Caisse Statut**: Update cash request status
- **Update Demande Caisse Validation All**: Validate all cash request items
- **Add Caisse Item**: Add item to cash request
- **Generate Demande Excel**: Export cash request to Excel
- **Generate Demande Pdf**: Export cash request to PDF

### 1.7 Justification Caisse (Cash Justification)
- **Create Justif Caisse**: Create cash justification
- **Create Justif Caisse Admin**: Admin creates justification for user
- **Add Justif Caisse**: Add justification data
- **Add Justif Caisse Admin Auto**: Auto-add justification for user
- **Add Justif Caisse User First Time**: First-time user justification
- **Admin User List**: View users for admin
- **Create Or Update Depenses**: Create/update expenses
- **Create Or Update Recettes**: Create/update receipts
- **Delete Depense**: Delete expense
- **Delete Recette**: Delete receipt
- **Delete Justife Caisse**: Delete justification
- **Generate Justif Caisse Excel**: Export justification to Excel
- **Generate Justif Caisse PDF**: Export justification to PDF
- **Get All Justif Caisse**: Get all justifications
- **Justife Caisse List User**: View user justifications
- **List Chantier User**: View user chantiers
- **Save All Data**: Save all justification data
- **Save Recettes Admin**: Admin saves receipts
- **Update Depence Validation**: Validate expense
- **Update Solde Precedent Admin**: Admin updates previous balance
- **Validate All Depenses**: Validate all expenses
- **View Justif Caisse**: View justification
- **View Justif Caisse Admin**: Admin views justification

### 1.8 Demande Prix (Price Requests)
- **Create Demande Prix**: Create price request
- **Store Demande Prix**: Submit price request
- **List Demande Prix**: View price requests
- **View Demande Prix**: View price request details
- **Edit Demande Prix**: Edit price request
- **Update Demande Prix**: Modify price request
- **Delete Demande Prix**: Remove price request
- **Delete Article**: Delete article from price request
- **Generate Demande Prix PDF**: Export price request to PDF
- **Send Demande Prix Email**: Send price request via email
- **Post Demande Prix Via Fourniture**: Create price request from supply

### 1.9 Demande Fourniture (Supply Requests)
- **Create Demande Fourniture**: Create supply request
- **Store Demande Fourniture**: Submit supply request
- **Index Demande Fourniture**: View supply requests
- **View Demande Fourniture**: View supply request details
- **Edit Demande Fourniture**: Edit supply request
- **Update Demande Fourniture**: Modify supply request
- **Delete Demande Fourniture**: Remove supply request
- **Add Pricing For Demande**: Add pricing to request
- **Update Etat**: Update request status
- **Update Validation Fourniture**: Validate supply request
- **Upload Four**: Upload supplier documents
- **Upload Image Fourniture**: Upload supply images
- **Upload Temp Image**: Upload temporary images
- **Download Image Fourniture**: Download supply images
- **Validate All Fourniture**: Validate all supply requests
- **Generate Demande Fourniture PDF**: Export supply request to PDF
- **Send Today Demandes WhatsApp**: Send today's requests via WhatsApp

### 1.10 Situation Achats (Purchase Situation)
- **Get Situation Generale**: Get overall purchase situation
- **Filter by Status**: Filter by BC status (en_attente_bl, partiel, livre, annule)
- **Filter by Supplier**: Filter by supplier name
- **Filter by Number**: Filter by BC number
- **Filter by Amount**: Filter by min/max amount
- **Filter by Designation**: Filter by article designation
- **Filter by Year**: Filter by year (default 2026)
- **KPI Cards**: View key performance indicators
  - Solde dû (Amount due)
  - Commande (Orders)
  - Facture (Invoices)
  - Réglé (Paid)
- **Pagination**: Paginated results (20 per page)

---

## 2. TRESORERIE (Treasury Module)

### 2.1 Virements (Transfers)
- **Index Virement**: View all transfers
- **Create Virement**: Create new transfer
- **Post Virement**: Submit transfer
- **Show Update Virement**: View transfer update form
- **Update Vire**: Update transfer
- **Show Virement**: View transfer details
- **Generate Virement PDF**: Export transfer to PDF
- **Delete Virement**: Delete transfer
- **Suppliers List**: View suppliers list
- **List Banques Virements**: View banks for transfers
- **Update Virement Allocations**: Update transfer allocations
- **Transfer Types**: RTGS, SRBM, Instantane

### 2.2 Effets (Bills of Exchange)
- **Index Effets**: View all effets
- **Create Effet**: Create new effet
- **Store Effet**: Submit effet
- **Edit Effet**: Edit effet
- **Update Effet**: Update effet
- **Delete Effet**: Delete effet
- **View Effet**: View effet details
- **Generate Effet PDF**: Export effet to PDF
- **Send Effet Email**: Send effet via email

### 2.3 Cheques
- **Index Cheques**: View all cheques
- **Create Cheque**: Create new cheque
- **Store Cheque**: Submit cheque
- **Edit Cheque**: Edit cheque
- **Update Cheque**: Update cheque
- **Delete Cheque**: Delete cheque
- **View Cheque**: View cheque details
- **Generate Cheque PDF**: Export cheque to PDF
- **Send Cheque Email**: Send cheque via email

### 2.4 Banques (Banks)
- **Index Banques**: View all banks
- **Create Banque**: Create new bank
- **Store Banque**: Submit bank
- **Edit Banque**: Edit bank
- **Update Banque**: Update bank
- **Delete Banque**: Delete bank
- **View Banque**: View bank details

### 2.5 Historique (History)
- **Index His**: View history
- **Save Encaissement**: Save deposit
- **Delete Encaissement**: Delete deposit
- **Export Historique Excel**: Export history to Excel
- **Export Historique Pdf**: Export history to PDF
- **Update History Banque**: Update bank history

### 2.6 Situation Tresorerie (Treasury Situation)
- **View Situation**: View treasury situation
- **Filter by Bank**: Filter by bank
- **Filter by Date**: Filter by date range
- **Balance Calculations**: Calculate balances

### 2.7 Virement Pay (BMCE Integration)
- **Index Virement Pay**: View BMCE transfers
- **BMCE Pay**: BMCE payment interface
- **BMCE Upload**: Upload BMCE files
- **BMCE Preview**: Preview BMCE files
- **BMCE Delete**: Delete BMCE files
- **BMCE Download**: Download BMCE files
- **BMCE Payment Processing**: Process BMCE payments

---

## 3. VENTES (Sales Module)

### 3.1 Clients (Customers)
- **List Clients**: View all clients
- **Create Client**: Create new client
- **Post Client**: Submit client
- **Update Client**: Update client
- **Delete Client**: Delete client
- **Show Client**: View client details
- **Update UI Client**: Update client UI

### 3.2 Devis (Quotes)
- **Create Devis**: Create new quote
- **Store Devis**: Submit quote
- **List Devis**: View quotes
- **View Devis**: View quote details
- **Edit Devis**: Edit quote
- **Update Devis**: Update quote
- **Delete Devis**: Delete quote
- **Generate Devis PDF**: Export quote to PDF
- **Send Devis Email**: Send quote via email

### 3.3 Commandes (Orders)
- **Create Commande**: Create new order
- **Store Commande**: Submit order
- **List Commandes**: View orders
- **View Commande**: View order details
- **Edit Commande**: Edit order
- **Update Commande**: Update order
- **Delete Commande**: Delete order
- **Generate Commande PDF**: Export order to PDF
- **Send Commande Email**: Send order via email

### 3.4 Factures Ventes (Sales Invoices)
- **Create Facture Vente**: Create sales invoice
- **Store Facture Vente**: Submit sales invoice
- **List Factures Ventes**: View sales invoices
- **View Facture Vente**: View sales invoice details
- **Edit Facture Vente**: Edit sales invoice
- **Update Facture Vente**: Update sales invoice
- **Delete Facture Vente**: Delete sales invoice
- **Generate Facture Vente PDF**: Export sales invoice to PDF
- **Send Facture Vente Email**: Send sales invoice via email

---

## 4. USERS & AUTHENTICATION

### 4.1 User Management
- **List Users**: View all users
- **Add User**: Create new user
- **Edit User**: Edit user
- **Delete User**: Delete user
- **User Roles**: Admin, Grandadmin, User
- **User Permissions**: Role-based access control

### 4.2 Authentication
- **Login**: User login
- **Logout**: User logout
- **Session Management**: Session handling
- **Password Hashing**: Bcrypt password encryption

---

## 5. SETTINGS

### 5.1 General Settings
- **Settings Index**: View settings
- **Add Numbers**: Add phone numbers
- **Delete Num**: Delete phone number
- **Edit Setting Num**: Edit phone number settings
- **WhatsApp Notifications**: Configure WhatsApp notification recipients
  - Active/inactive status
  - Notify for fourniture
  - Notify for justif caisse

### 5.2 List Fourniture
- **Get List Fourniture**: Get supply list for autocomplete

---

## 6. CHANTIERS (Projects)

### 6.1 Chantier Management
- **Index Chantiers**: View all projects
- **Post Chantier**: Create new project
- **Show Chantier Details**: View project details
- **Update Chantier**: Update project
- **Destroy Chantier**: Delete project
- **Destroy Chantier Details**: Delete project details
- **Post Chantier Items**: Add items to project
- **Show Chantier Details**: View project details with items

---

## 7. BUG REPORTS

### 7.1 Bug Tracking
- **List Bug Reports**: View all bug reports
- **Create Bug Report Form**: Create bug report form
- **Create Bug Report**: Submit bug report
- **Edit Bug Report Form**: Edit bug report form
- **Update Bug Report**: Update bug report
- **Delete Bug Report**: Delete bug report
- **Get Bug Report**: Get specific bug report
- **Get Bug Stats**: Get bug statistics
- **Upload Bug Screenshot**: Upload bug screenshots

---

## 8. POPUPS

### 8.1 Popup Management
- **List Popups**: View all popups
- **Create Popup Form**: Create popup form
- **Create Popup**: Create popup
- **Edit Popup Form**: Edit popup form
- **Update Popup**: Update popup
- **Delete Popup**: Delete popup
- **Get Active Popups For User**: Get active popups for user
- **Dismiss Popup**: Dismiss popup
- **Toggle User Popup**: Toggle popup for user
- **Get Popup Stats**: Get popup statistics

---

## 9. WHATSAPP INTEGRATION

### 9.1 WhatsApp Service
- **Client Initialization**: WhatsApp Web client setup
- **Session Management**: Session persistence
- **Message Sending**: Send text messages
- **Media Sending**: Send documents (PDF, images)
- **Reconnection Logic**: Auto-reconnection on disconnect
- **QR Code Generation**: QR code for pairing
- **Notification Recipients**: Manage notification recipients

### 9.2 WhatsApp Notifications
- **Demande Fourniture**: Send supply requests via WhatsApp
- **Justification Caisse**: Send cash justifications via WhatsApp
- **Daily Notifications**: Send daily summaries
- **PDF Attachments**: Send PDF documents with messages

---

## 10. PDF GENERATION

### 10.1 PDF Features
- **BC PDF**: Generate BC PDF
- **BL PDF**: Generate BL PDF
- **Facture PDF**: Generate invoice PDF
- **Demande Prix PDF**: Generate price request PDF
- **Demande Fourniture PDF**: Generate supply request PDF
- **Justif Caisse PDF**: Generate cash justification PDF
- **Virement PDF**: Generate transfer PDF
- **Effet PDF**: Generate effet PDF
- **Cheque PDF**: Generate cheque PDF
- **Devis PDF**: Generate quote PDF
- **Commande PDF**: Generate order PDF
- **Facture Vente PDF**: Generate sales invoice PDF

### 10.2 Excel Export
- **Demande Caisse Excel**: Export cash request to Excel
- **Justif Caisse Excel**: Export cash justification to Excel
- **Historique Excel**: Export history to Excel

---

## 11. EMAIL INTEGRATION

### 11.1 Email Features
- **Send BC Email**: Send BC via email
- **Send BL Email**: Send BL via email
- **Send Facture Email**: Send invoice via email
- **Send Demande Prix Email**: Send price request via email
- **Send Effet Email**: Send effet via email
- **Send Cheque Email**: Send cheque via email
- **Send Devis Email**: Send quote via email
- **Send Commande Email**: Send order via email
- **Send Facture Vente Email**: Send sales invoice via email

---

## 12. DASHBOARD

### 12.1 Main Dashboard
- **Overview Cards**: Quick stats for each module
- **Navigation**: Easy access to all modules
- **User Info**: Display current user information

### 12.2 Module Dashboards
- **Achats Dashboard**: Purchase module overview
- **Tresorerie Dashboard**: Treasury module overview
- **Ventes Dashboard**: Sales module overview
- **Caisse Dashboard**: Cash management overview

---

## 13. DATABASE & DATA MANAGEMENT

### 13.1 Prisma ORM
- **Database Models**: All data models defined in Prisma schema
- **Relations**: Model relationships (BC-BL-Facture, etc.)
- **Transactions**: Database transaction support
- **Migrations**: Database schema migrations

### 13.2 Data Models
- **User**: User accounts
- **Chantier**: Projects
- **Fournisseur**: Suppliers
- **Client**: Customers
- **BondeCommande**: Purchase orders
- **BondeLivraison**: Delivery notes
- **Facture**: Invoices
- **FactureAvoir**: Credit notes
- **DemandeFourniture**: Supply requests
- **DemandePrix**: Price requests
- **JustifCaisse**: Cash justifications
- **RecetteCaisse**: Cash receipts
- **DepenseCaisse**: Cash expenses
- **Virement**: Transfers
- **Effet**: Bills of exchange
- **Cheque**: Cheques
- **Banque**: Banks
- **WhatsAppNotificationRecipient**: WhatsApp notification settings
- **BugReport**: Bug reports
- **Popup**: Popups

---

## 14. SECURITY & PERMISSIONS

### 14.1 Role-Based Access Control (RBAC)
- **Grandadmin**: Full system access
- **Admin**: Admin access to most features
- **User**: Limited access to assigned features

### 14.2 Authentication
- **Session-based Authentication**: Session management
- **Password Hashing**: Bcrypt encryption
- **Login/Logout**: Secure authentication flow

### 14.3 Authorization
- **Route Protection**: Middleware for protected routes
- **User Ownership**: Users can only access their own data
- **Admin Override**: Admins can access all data

---

## 15. API ENDPOINTS

### 15.1 REST API
- **API Router**: Separate API routes for external access
- **JWT Authentication**: Token-based API authentication
- **React Native Support**: Mobile app API endpoints
- **Fourniture API**: Supply management API
- **User Data API**: User data endpoints

---

## 16. FILE UPLOADS

### 16.1 Upload Features
- **Multer**: File upload middleware
- **Image Upload**: Upload images for supplies, etc.
- **Document Upload**: Upload PDFs, Excel files
- **File Storage**: Local file storage
- **File Download**: Download uploaded files

---

## 17. SEARCH & FILTERING

### 17.1 Search Features
- **Global Search**: Search across modules
- **Module-specific Search**: Search within specific modules
- **Autocomplete**: Autocomplete for suppliers, items, etc.
- **Suggestions**: Designation and reference suggestions

### 17.2 Filter Features
- **Date Filters**: Filter by date ranges
- **Status Filters**: Filter by status (livre, en_attente, etc.)
- **Supplier Filters**: Filter by supplier
- **Amount Filters**: Filter by min/max amounts
- **Year Filters**: Filter by year

---

## 18. PAGINATION

### 18.1 Pagination Features
- **Default Limit**: 20 items per page
- **Customizable**: Adjustable page size
- **Navigation**: Page navigation controls
- **Total Count**: Display total item count

---

## 19. VALIDATION

### 19.1 Data Validation
- **Form Validation**: Client-side validation
- **Server Validation**: Server-side validation
- **Prisma Validation**: Database-level validation
- **Custom Validation**: Custom validation rules

---

## 20. NOTIFICATIONS

### 20.1 WhatsApp Notifications
- **Real-time Notifications**: Send WhatsApp messages
- **PDF Attachments**: Attach PDFs to messages
- **Recipient Management**: Manage notification recipients
- **Notification Types**: Different notification types for different events

### 20.2 Popups
- **Active Popups**: Display active popups to users
- **User-specific Popups**: Target specific users
- **Dismiss Popups**: Allow users to dismiss popups
- **Popup Stats**: Track popup engagement

---

## 21. REPORTING

### 21.1 Reports
- **Situation Generale**: Overall purchase situation
- **Situation Tresorerie**: Treasury situation
- **KPI Cards**: Key performance indicators
- **Bug Stats**: Bug report statistics
- **Popup Stats**: Popup statistics

---

## 22. INTEGRATIONS

### 22.1 External Integrations
- **BMCE**: Bank integration for payments
- **WhatsApp Web**: WhatsApp messaging
- **Email**: Email sending (nodemailer)

---

## 23. UI/UX FEATURES

### 23.1 Design
- **Bootstrap**: Bootstrap CSS framework
- **SB Admin 2**: Admin dashboard template
- **FontAwesome**: Icons
- **Responsive Design**: Mobile-friendly interface

### 23.2 User Experience
- **Autocomplete**: Quick data entry
- **Dynamic Forms**: Forms that adapt to user input
- **Real-time Updates**: Live data updates
- **Loading States**: Visual feedback during operations
- **Error Handling**: Clear error messages
- **Success Messages**: Confirmation messages

---

## 24. DEVELOPMENT FEATURES

### 24.1 Code Organization
- **MVC Architecture**: Model-View-Controller pattern
- **Modular Structure**: Separate modules for each feature
- **Reusable Components**: Shared code components
- **Middleware**: Express middleware for common tasks

### 24.2 Development Tools
- **ES Modules**: Modern JavaScript modules
- **Prisma**: ORM for database operations
- **EJS**: Template engine for views
- **Multer**: File upload handling
- **Bcrypt**: Password hashing
- **Nodemailer**: Email sending
- **Puppeteer**: Browser automation (WhatsApp)
- **WhatsApp Web.js**: WhatsApp integration

---

## 25. DEPLOYMENT

### 25.1 Deployment Features
- **Environment Variables**: Configuration via environment
- **Session Storage**: Session persistence
- **File Storage**: Local file storage
- **Database**: PostgreSQL database
- **Node.js**: Runtime environment

---

## Summary

Confonda ERP is a comprehensive business management system covering:
- **Purchases**: BC, BL, Factures, Suppliers, Supplies
- **Treasury**: Transfers, Effets, Cheques, Banks
- **Sales**: Clients, Quotes, Orders, Sales Invoices
- **Cash Management**: Cash requests, Justifications
- **User Management**: Users, Roles, Permissions
- **Communication**: WhatsApp, Email notifications
- **Reporting**: PDF/Excel exports, KPIs, Dashboards
- **Security**: Authentication, Authorization, RBAC

The system is designed to be modular, scalable, and user-friendly with a focus on automation and integration between modules.
