# Bon de Commande (BC) — Architecture & Proposed Feature

## 🔧 Overview
This document explains the current Bon de Commande (BC) logic used in the codebase and proposes a concrete new feature to improve BC handling: **an approval & pricing workflow** (draft → price negotiation → approval → sending). It includes: current flow, DB models, endpoints, important implementation details, and a proposed feature spec with acceptance criteria and migration notes.

---

## 📋 Current BC flow (short summary)
- Source: BCs are created from a DemandeFourniture (supply request) via `postBcDemandeFourniture`.
- Items are grouped by supplier (fournisseur) and one BondeCommande record is created per supplier containing its `commandesItems`.
- For each created BC, a `BondeCommandeChantierItem` allocation is created for the corresponding chantier.
- The response from creation returns the list of created BC ids and a count.
- Other supported operations:
  - List BCs (renders `views/dashboard/achats/bc/list`) — `listBc`
  - Delete BC (`deleteBc`) — deletes `commandesItems` then the `bondeCommande` row
  - Generate PDF (`generateBcPDF`) — renders stylish PDF with totals, signature box, and supplier box
  - Send BC by email (`sendBcEmail`) — generates a PDF buffer and sends via SMTP

---

## 📦 Database models (key parts)
- BondeCommande
  - id, date, fournisseurId, chantierId?, demandeur, commandesItems (relation)
  - totalHt, tauxTva, totalTtc, montantLettre

- commandesItems
  - id, designation, unite, quantite, prixUnitaire?, totalHt?, bondeCommandeId?

- BondeCommandeChantierItem
  - links a commandesItem to a chantier with qty and montant

- DemandeFourniture / ItemFourniture
  - `postBcDemandeFourniture` reads items from `ItemFourniture` and creates commandesItems

Reference: `prisma/schema.prisma` (models: `BondeCommande`, `commandesItems`, `BondeCommandeChantierItem`).

---

## ⚙️ Key implementation details & edge cases
- Creation groups items by `fournisseurId` and ignores invalid supplier or invalid item ids.
- The controller validates the presence of `demandeId` and `items[]` in the request body.
- Creation flow sets `date: new Date()`, creates commandesItems with `designation`, `unite`, and `quantite`.
- After commandesItems are created, an allocation (`BondeCommandeChantierItem`) is created per item to keep chantier-level tracking.
- The PDF generator:
  - Uses PDFKit; supports multi-page BCs, header with logo, supplier box, item table, totals and signature blocks.
  - Totals are computed from `bc.totalHt`, `bc.tauxRemise`, `bc.tauxTva` when present.
- Email send flow generates PDF in-memory and uses nodemailer SMTP transporter.

---

## ✅ Observations & opportunities for improvements
- `commandesItems.prixUnitaire` is optional but PDFs rely on it for totals. Currently there's no enforced flow where prices are entered and approved before sending BC to supplier.
- BCs lack a status/approval workflow (draft, pending approval, approved, sent), which makes it hard to: track which BCs are ready to be sent, support price negotiation, or enforce a sign-off.
- Deleting BC removes items by cascade behaviour coded in controller (explicit deleteMany then delete). Consider DB-level cascade or safer soft-delete if audit is needed.

---

## 💡 Proposed New Feature — Approval & Pricing Workflow (detailed spec)
Goal: Add a simple, auditable BC lifecycle so users can set prices on BC items, negotiate, approve, and then send the BC to the supplier.

### Feature summary
- Add BC statuses: `draft` (default), `pending_approval`, `approved`, `sent`, `cancelled`.
- Allow prices to be set on `commandesItems` (client or UI) after BC creation.
- Allow patching individual item prices or the whole BC (ex: `PATCH /api/bc/:id/prices`).
- `Approve` action finalizes prices and sets BC status to `approved` with `approvedBy` and `approvedAt` metadata.
- Sending a BC (`sendBcEmail`) will only be allowed when BC status is `approved` (server-side guard).
- Support an optional `sendOnApproval` boolean to auto-send once approved.

### DB changes / migration (Prisma)
- `BondeCommande` additions:
  - `status  String  @default("draft")` // enum-like string
  - `approvedBy String?` // user name or id
  - `approvedAt DateTime?`
  - `sentAt DateTime?` // when email sent
- `commandesItems`:
  - ensure `prixUnitaire Float?` present (already exists); optionally enforce not-null after approval using application logic

Migration steps:
1. Add fields to Prisma schema and `prisma migrate dev`.
2. Backfill existing BCs to `status = "approved"` if they already have non-null totals, or `draft` for others (depends on policy).

### API additions / changes
- PATCH /api/bc/:id/prices
  - Body: { items: [{ id, prixUnitaire }], totalHt?: number }
  - Validation: only allowed when status in ["draft", "pending_approval"]
  - Response: { success, updatedBc }

- POST /api/bc/:id/approve
  - Body: { approverId/approverName, sendOnApproval?: boolean }
  - Server: computes totals, marks `approvedAt`, `approvedBy`, `status = 'approved'`.
  - If `sendOnApproval` true, call send email and set `sentAt` on success.

- GET /api/bc?status=approved|draft|pending_approval
  - Filters list by status (UI filter)

- Update `sendBcEmail` to refuse if BC status != 'approved' (unless `force` flag and user is an admin)

### Acceptance criteria (testable)
- AC1: Creating BCs from `DemandeFourniture` preserves current behavior (no breaking change).
- AC2: A user can patch prices only while BC is `draft` or `pending_approval`.
- AC3: Approving computes and stores totals, sets `approvedBy` and `approvedAt`, and prevents further price edits.
- AC4: Sending an email is refused for BCs that are not `approved` (HTTP 400 + message) unless `force` with admin.
- AC5: UI can filter BCs by status and show `approvedAt` and `sentAt` timestamps.

### UI changes (minimal)
- In BC edit view: show status badge and actions according to status.
- Allow users to edit `prixUnitaire` per item in `draft` status.
- Add `Approve` button (modal - confirm approver and optional `sendOnApproval`).
- Show timeline (createdAt, approvedAt, sentAt).

### Implementation plan (high level tasks)
1. DB migration (add fields).
2. Backend: add endpoints (`/prices`, `/approve`, status filter), update `sendBcEmail` check.
3. Backend tests for API flows and guards.
4. Frontend: edit page for BC with price inputs + approve action + filters.
5. QA & deploy.

---

## 📌 Suggested small first step (low risk)
- Add the `status` field to `BondeCommande` and guard `sendBcEmail` to require `approved` status; return a helpful error if not approved. This allows iterating on the approval UX with minimal DB complexity.

---

## Next steps / Questions for you
- Do you want me to write and open a migration + server changes for the status field only (safe first step)?
- Or do you prefer I implement the full feature (DB migration, API + UI + tests)?

---

If you want, I can now:
1) Open a branch and create the Prisma migration for `status` and audit fields.
2) Implement the server-side `approve` API and `PATCH` prices endpoints.
3) Add UI changes in `views/dashboard/achats/bc/*` to support price editing + approve.

Tell me which option you prefer and I’ll proceed.
