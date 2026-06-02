# Confonda ERP - Technical Documentation & AI Strategy (Source-Based)

## 1. Application Architecture & Functionality

Confonda is a robust ERP system built with Node.js, Express, and Prisma, designed to manage the full lifecycle of construction business operations. It focuses on financial traceability and operational efficiency across three main pillars:

### A. Procurement & Operations (Achats)
*   **Demandes de Fourniture & Prix:** Site managers initiate requests for materials. These can be converted into Price Requests (`DemandePrix`) or directly into Purchase Orders.
*   **Bon de Commande (BC):** The central hub for purchasing. BCs track quantities ordered vs. received and are linked to specific projects (`Chantiers`).
*   **Bon de Livraison (BL) & Facturation:** A rigorous 3-way match system:
    1.  **BL** confirms physical receipt of goods from a **BC**.
    2.  **Facture** (Invoice) is then linked to one or more **BLs**.
    3.  **Avoirs** (Credit Notes) manage returns or discounts at the item level.
*   **Petty Cash Management (Caisse):** A structured workflow where site managers request funds (`DemandeCaisse`) and later provide monthly justifications (`JustifCaisse`) for expenses, which are then validated by admins.

### B. Treasury & Finance (Trésorerie)
*   **Multi-Bank Management:** Tracks balances and operations across multiple bank accounts.
*   **Payment Instruments:** 
    *   **Cheques & Effets:** Advanced management including PDF generation for specific Moroccan bank formats (AWB, BMCE, BP, etc.) and status tracking (Circulation, Paid, Unpaid).
    *   **Virements & Mise à Disposition:** Direct bank transfers and cash disbursement management.
*   **Forecasting:** `Payavenir` and `Recavenir` modules allow the company to project future cash flows based on committed payments and expected collections.

### C. Project & Client Management (Ventes & Chantiers)
*   **Chantiers:** The core operational unit. Every expense (BC, Caisse) and every revenue (Encaissement) is allocated to a specific project to track profitability.
*   **Clients:** Management of customer accounts and project associations.

### D. System Services
*   **WhatsApp Integration:** Automated notifications for field personnel (supplies, cash alerts).
*   **Bug Reporting:** Built-in tool for users to report UI/functional issues directly to developers.
*   **Popups:** Targeted administrative messaging system.

---

## 2. AI Integration Opportunities

Based on the existing code logic and business flows, here is how AI can make Confonda "intelligent":

### A. Intelligent Document Processing (OCR 2.0)
*   **The Problem:** Users manually enter data from scanned BLs and Factures.
*   **The AI Solution:** Use a Vision-Language Model to parse uploaded PDFs/Images.
*   **Impact:** Automatically detect items, quantities, and prices from a supplier's invoice and match them against the original `Bon de Commande`. It would flag discrepancies (e.g., "Supplier is charging $50 for an item ordered at $45").

### B. Proactive Cash Flow Assistant
*   **The Problem:** Admins must manually check `Payavenir` and bank balances to ensure liquidity.
*   **The AI Solution:** A time-series forecasting model that analyzes historical trends and upcoming commitments.
*   **Impact:** The system sends a WhatsApp alert: *"Warning: Based on current Cheques in circulation and expected Recavenir, your BP account will be short by 20,000 DH next Tuesday."*

### C. WhatsApp Field Agent (Conversational ERP)
*   **The Problem:** Site managers find it tedious to use the web/mobile UI for simple status checks.
*   **The AI Solution:** Integrate an LLM (Large Language Model) with the existing WhatsApp bot.
*   **Impact:** 
    *   Manager asks: *"Did the steel for Chantier X arrive?"*
    *   AI checks BLs and replies: *"Yes, 5 tons were delivered yesterday. 2 tons are still pending from BC #442."*
    *   Manager says: *"I need 20 bags of cement."* -> AI drafts the `DemandeFourniture` automatically.

### D. Smart Accounting Imputation
*   **The Problem:** Users often choose the wrong "Imputation" (account category) for expenses.
*   **The AI Solution:** A classification model trained on historical data.
*   **Impact:** When a user types "Diesel for generator", the AI automatically selects the correct accounting code, reducing errors for the finance team.

### E. Anomaly Detection & Fraud Prevention
*   **The Problem:** Large volumes of petty cash justifications are hard to audit manually.
*   **The AI Solution:** Pattern recognition to identify outliers.
*   **Impact:** Flag justifications that are statistically unusual (e.g., "The price of sand on this project is 30% higher than all other projects this month").

---

## 3. Recommended AI Tech Stack for Confonda

*   **Extraction:** AWS Textract or Google Document AI for high-accuracy OCR.
*   **Intelligence:** OpenAI GPT-4o-mini or Claude 3.5 Sonnet for the WhatsApp Agent and data matching.
*   **Forecasting:** Prophet or simple LSTM models for Treasury predictions.
*   **Integration:** Vector database (like Pinecone) to store project documentation for rapid RAG (Retrieval-Augmented Generation) queries via WhatsApp.

---
*Created by: Gemini CLI Assistant*
*Target: Ali - System Documentation*
