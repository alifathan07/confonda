import prisma from "../db.js";
import ExcelJS from 'exceljs';
import puppeteer from 'puppeteer';
export const indexHis = async (req, res) => {
  try {

    // Parse dates with fallback
  

    // Validate parsed dates
   

    // Fetch cheques
    const cheques = await prisma.cheque.findMany({
      where: {
        statut: { notIn: ['Annulé', 'annulé', 'ANNULE'] },
        dateEcheance: { not: null },
      },
      select: {
        id: true,
        numero: true,
        dateEtablissement: true,
        montant: true,
        chantier : {select: {nom: true}},
        allocations: {
          select: {
            montant: true,
            chantierId: true,
            chantier: { select: { nom: true } },
          },
        },
        dateEcheance: true,
        validation: true,
        beneficiaire: true,
        statut: true,
        obs: true,
        banque: { select: { name: true } },
      },
      orderBy: { dateEtablissement: 'desc' },
    });

    // Fetch effets
    const effets = await prisma.effet.findMany({
      where: {
        statut: { notIn: ['Annulé', 'annulé', 'ANNULE'] },
        dateEcheance: { not: null },
      },
      select: {
        id: true,
        numero: true,
        dateEtablissement: true,
        montant: true,
        chantier : {select: {nom: true}},
        allocations: {
          select: {
            montant: true,
            chantierId: true,
            chantier: { select: { nom: true } },
          },
        },
        dateEcheance: true,
        validation: true,
        beneficiaire: true,
        obs: true,
        statut: true,
        banque: { select: { name: true } },
      },
      orderBy: { dateEtablissement: 'desc' },
    });

    // Fetch telepaimentPrelevement
   

    // Fetch virements (excluding confonda)
    const virements = await prisma.virement.findMany({
      select: {
        id: true,
        designation: true,
        date: true,
        montant: true,
        chantier : {select: {nom: true}},
        allocations: {
          select: {
            montant: true,
            chantierId: true,
            chantier: { select: { nom: true } },
          },
        },
        dateReglement: true,
        beneficiaire: true,
        obs: true,
        banque: { select: { name: true } },
        objet: true,
        cause: true,
        rtgs: true,
        srbm: true,
        instantane: true,
        montantLettres: true,
      },
      orderBy: { date: 'desc' },
    });

    // Fetch mise à disposition
    const miseadis = await prisma.miseadis.findMany({
      where: {
        NOT: { date: null },
      },
      select: {
        id: true,
        beneficiaire: true,
        montant: true,
        date: true,
        dateReglement: true,
        chantier : {select: {nom: true}},
        allocations: {
          select: {
            montant: true,
            chantierId: true,
            chantier: { select: { nom: true } },
          },
        },
        obs: true,
        cin: true,
        objet: true,
        cause: true,
        banque: { select: { name: true } },
      },
      orderBy: { date: 'desc' },
    });

    const telepaimentPrelevement = await prisma.telepaimentPrelevement.findMany({
      select: {
        id: true,
        dateEtablissement: true,
        montant: true,
        chantier : {select: {nom: true}},
        banque: { select: { name: true } },
        fournisseur: { select: { name: true } },
        observation: true,
        type: true,
      },
      orderBy: { dateEtablissement: 'desc' },
    });

    // Fetch fournisseurs and banques
    const fournisseurs = await prisma.fournisseur.findMany();
    const banques = await prisma.banque.findMany();

    // Combine and filter valid records
    const historique = [
      // --- Chèques ---
      ...cheques.map(c => ({
        id: c.id,
        numero: c.numero,
        dateEtablissement: c.dateEtablissement,
        montant: c.montant,
        chantier: (() => {
          const allocs = Array.isArray(c.allocations) ? c.allocations : [];
          const names = allocs
            .map(a => (a && a.chantier && a.chantier.nom) ? String(a.chantier.nom).trim() : '')
            .filter(Boolean);

          if (names.length) {
            return Array.from(new Set(names)).join(', ');
          }

          return c.chantier?.nom || 'Aucun';
        })(),
        chantierLines: (() => {
          const allocs = Array.isArray(c.allocations) ? c.allocations : [];
          const map = new Map();
          for (const a of allocs) {
            const nom = (a && a.chantier && a.chantier.nom) ? String(a.chantier.nom).trim() : '';
            if (!nom) continue;
            const prev = map.get(nom) || 0;
            map.set(nom, prev + Number(a.montant || 0));
          }

          const lines = Array.from(map.entries()).map(([nom, montant]) => ({ nom, montant }));
          if (lines.length) return lines;

          if (c.chantier?.nom) {
            return [{ nom: c.chantier.nom, montant: Number(c.montant || 0) }];
          }
          return [];
        })(),
        chantierNames: (() => {
          const allocs = Array.isArray(c.allocations) ? c.allocations : [];
          const names = allocs
            .map(a => (a && a.chantier && a.chantier.nom) ? String(a.chantier.nom).trim() : '')
            .filter(Boolean);
          if (names.length) return Array.from(new Set(names));
          if (c.chantier?.nom) return [String(c.chantier.nom)];
          return [];
        })(),
        dateEcheance: c.dateEcheance,
        validation: c.validation,
        beneficiaire: c.beneficiaire,
        statut: c.statut,
        obs: c.obs,
        banque: c.banque?.name || 'Aucun',
        type: 'Chèque',
      })),

      // --- Effets ---
      ...effets.map(e => ({
        id: e.id,
        numero: e.numero,
        dateEtablissement: e.dateEtablissement,
        montant: e.montant,
        chantier: (() => {
          const allocs = Array.isArray(e.allocations) ? e.allocations : [];
          const names = allocs
            .map(a => (a && a.chantier && a.chantier.nom) ? String(a.chantier.nom).trim() : '')
            .filter(Boolean);

          if (names.length) {
            return Array.from(new Set(names)).join(', ');
          }

          return e.chantier?.nom || 'Aucun';
        })(),
        chantierLines: (() => {
          const allocs = Array.isArray(e.allocations) ? e.allocations : [];
          const map = new Map();
          for (const a of allocs) {
            const nom = (a && a.chantier && a.chantier.nom) ? String(a.chantier.nom).trim() : '';
            if (!nom) continue;
            const prev = map.get(nom) || 0;
            map.set(nom, prev + Number(a.montant || 0));
          }

          const lines = Array.from(map.entries()).map(([nom, montant]) => ({ nom, montant }));
          if (lines.length) return lines;

          if (e.chantier?.nom) {
            return [{ nom: e.chantier.nom, montant: Number(e.montant || 0) }];
          }
          return [];
        })(),
        chantierNames: (() => {
          const allocs = Array.isArray(e.allocations) ? e.allocations : [];
          const names = allocs
            .map(a => (a && a.chantier && a.chantier.nom) ? String(a.chantier.nom).trim() : '')
            .filter(Boolean);
          if (names.length) return Array.from(new Set(names));
          if (e.chantier?.nom) return [String(e.chantier.nom)];
          return [];
        })(),

        dateEcheance: e.dateEcheance,
        validation: e.validation,
        beneficiaire: e.beneficiaire,
        statut: e.statut,
        obs: e.obs,
        banque: e.banque?.name || 'Aucun',
        type: 'Effet',
      })),

      // --- Virements ---
      ...virements.map(v => ({
        id: v.id,
        numero: v.designation || 'Aucun',
        dateEtablissement: v.date,
        montant: v.montant,
        chantier: (() => {
          const allocs = Array.isArray(v.allocations) ? v.allocations : [];
          const names = allocs
            .map(a => (a && a.chantier && a.chantier.nom) ? String(a.chantier.nom).trim() : '')
            .filter(Boolean);

          if (names.length) {
            return Array.from(new Set(names)).join(', ');
          }

          return v.chantier?.nom || 'Aucun';
        })(),
        chantierLines: (() => {
          const allocs = Array.isArray(v.allocations) ? v.allocations : [];
          const map = new Map();
          for (const a of allocs) {
            const nom = (a && a.chantier && a.chantier.nom) ? String(a.chantier.nom).trim() : '';
            if (!nom) continue;
            const prev = map.get(nom) || 0;
            map.set(nom, prev + Number(a.montant || 0));
          }

          const lines = Array.from(map.entries()).map(([nom, montant]) => ({ nom, montant }));
          if (lines.length) return lines;

          if (v.chantier?.nom) {
            return [{ nom: v.chantier.nom, montant: Number(v.montant || 0) }];
          }
          return [];
        })(),
        chantierNames: (() => {
          const allocs = Array.isArray(v.allocations) ? v.allocations : [];
          const names = allocs
            .map(a => (a && a.chantier && a.chantier.nom) ? String(a.chantier.nom).trim() : '')
            .filter(Boolean);
          if (names.length) return Array.from(new Set(names));
          if (v.chantier?.nom) return [String(v.chantier.nom)];
          return [];
        })(),
        dateEcheance: v.date,
        validation: false,
        beneficiaire: v.beneficiaire,
        statut: 'Aucun',
        obs: v.obs,
        banque: v.banque?.name || 'Aucun',
        type: 'Virement',
      })),

      // --- Virement de Fonds ---
    

      // --- Mise à disposition ---
      ...miseadis.map(m => ({
        id: m.id,
        numero: 'Aucun',
        dateEtablissement: m.date,
        montant: m.montant,
        chantier: (() => {
          const allocs = Array.isArray(m.allocations) ? m.allocations : [];
          const names = allocs
            .map(a => (a && a.chantier && a.chantier.nom) ? String(a.chantier.nom).trim() : '')
            .filter(Boolean);

          if (names.length) {
            return Array.from(new Set(names)).join(', ');
          }

          return m.chantier?.nom || 'Aucun';
        })(),
        chantierLines: (() => {
          const allocs = Array.isArray(m.allocations) ? m.allocations : [];
          const map = new Map();
          for (const a of allocs) {
            const nom = (a && a.chantier && a.chantier.nom) ? String(a.chantier.nom).trim() : '';
            if (!nom) continue;
            const prev = map.get(nom) || 0;
            map.set(nom, prev + Number(a.montant || 0));
          }

          const lines = Array.from(map.entries()).map(([nom, montant]) => ({ nom, montant }));
          if (lines.length) return lines;

          if (m.chantier?.nom) {
            return [{ nom: m.chantier.nom, montant: Number(m.montant || 0) }];
          }
          return [];
        })(),
        chantierNames: (() => {
          const allocs = Array.isArray(m.allocations) ? m.allocations : [];
          const names = allocs
            .map(a => (a && a.chantier && a.chantier.nom) ? String(a.chantier.nom).trim() : '')
            .filter(Boolean);
          if (names.length) return Array.from(new Set(names));
          if (m.chantier?.nom) return [String(m.chantier.nom)];
          return [];
        })(),
        
        dateEcheance: m.date,
        validation: false,
        beneficiaire: m.beneficiaire,
        statut: 'Aucun',
        obs: m.obs,
        banque: m.banque?.name || 'Aucun',
        type: 'Mise à disposition',
      })),

      // --- Telepaiment Prelevement ---
      ...telepaimentPrelevement.map(t => ({
        id: t.id,
        numero: "Aucun",
        dateEtablissement: t.dateEtablissement,
        montant: t.montant,
        chantier : t.chantier?.nom || 'Aucun',
        chantierLines: [],
        chantierNames: t.chantier?.nom ? [String(t.chantier.nom)] : [],
        dateEcheance: null,
        beneficiaire: t.fournisseur?.name || 'Aucun',
        obs: t.observation,
        banque: t.banque?.name || 'Aucun',
        type: t.type || 'télépaiment',
      })),
    ];

    // Sort by dateEtablissement descending
    historique.sort((a, b) => new Date(b.dateEtablissement) - new Date(a.dateEtablissement));
    const encaissements = await prisma.encaissementRecu.findMany({
      orderBy: { dateEtablissement: 'desc' },
      select: {
        id: true,
        dateEtablissement: true,
        type : true,
        montant: true,
        client: { select: { name: true } },
        chantier: { select: { nom: true } },
        banque: { select: { name: true } },
        observation: true,
      },
    });
  
    const clients = await prisma.client.findMany();
    const chantiers = await prisma.chantier.findMany();
    // Render the template
    res.render('dashboard/tresorerie/historique/index', {
      cheques,
      effets,
      virements,
      fournisseurs,
      banques,
      historique,
      encaissements,
      clients,
      chantiers,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Erreur serveur.');
  }
};

const buildHistoriqueOperations = async () => {
  // Fetch cheques
  const cheques = await prisma.cheque.findMany({
    where: {
      statut: { notIn: ['Annulé', 'annulé', 'ANNULE'] },
      dateEcheance: { not: null },
    },
    select: {
      id: true,
      numero: true,
      dateEtablissement: true,
      montant: true,
      chantier: { select: { nom: true } },
      allocations: {
        select: {
          montant: true,
          chantierId: true,
          chantier: { select: { nom: true } },
        },
      },
      dateEcheance: true,
      validation: true,
      beneficiaire: true,
      statut: true,
      obs: true,
      banque: { select: { name: true } },
    },
    orderBy: { dateEtablissement: 'desc' },
  });

  const effets = await prisma.effet.findMany({
    where: {
      statut: { notIn: ['Annulé', 'annulé', 'ANNULE'] },
      dateEcheance: { not: null },
    },
    select: {
      id: true,
      numero: true,
      dateEtablissement: true,
      montant: true,
      chantier: { select: { nom: true } },
      allocations: {
        select: {
          montant: true,
          chantierId: true,
          chantier: { select: { nom: true } },
        },
      },
      dateEcheance: true,
      validation: true,
      beneficiaire: true,
      obs: true,
      statut: true,
      banque: { select: { name: true } },
    },
    orderBy: { dateEtablissement: 'desc' },
  });

  const virements = await prisma.virement.findMany({
    select: {
      id: true,
      designation: true,
      date: true,
      montant: true,
      chantier: { select: { nom: true } },
      allocations: {
        select: {
          montant: true,
          chantierId: true,
          chantier: { select: { nom: true } },
        },
      },
      dateReglement: true,
      beneficiaire: true,
      obs: true,
      banque: { select: { name: true } },
      objet: true,
      cause: true,
      rtgs: true,
      srbm: true,
      instantane: true,
      montantLettres: true,
    },
    orderBy: { date: 'desc' },
  });

  const miseadis = await prisma.miseadis.findMany({
    where: {
      NOT: { date: null },
    },
    select: {
      id: true,
      beneficiaire: true,
      montant: true,
      date: true,
      dateReglement: true,
      chantier: { select: { nom: true } },
      allocations: {
        select: {
          montant: true,
          chantierId: true,
          chantier: { select: { nom: true } },
        },
      },
      obs: true,
      cin: true,
      objet: true,
      cause: true,
      banque: { select: { name: true } },
    },
    orderBy: { date: 'desc' },
  });

  const telepaimentPrelevement = await prisma.telepaimentPrelevement.findMany({
    select: {
      id: true,
      dateEtablissement: true,
      montant: true,
      chantier: { select: { nom: true } },
      banque: { select: { name: true } },
      fournisseur: { select: { name: true } },
      observation: true,
      type: true,
    },
    orderBy: { dateEtablissement: 'desc' },
  });

  const historique = [
    ...cheques.map(c => ({
      id: c.id,
      numero: c.numero,
      dateEtablissement: c.dateEtablissement,
      montant: c.montant,
      chantier: (() => {
        const allocs = Array.isArray(c.allocations) ? c.allocations : [];
        const names = allocs
          .map(a => (a && a.chantier && a.chantier.nom) ? String(a.chantier.nom).trim() : '')
          .filter(Boolean);
        if (names.length) return Array.from(new Set(names)).join(', ');
        return c.chantier?.nom || 'Aucun';
      })(),
      chantierLines: (() => {
        const allocs = Array.isArray(c.allocations) ? c.allocations : [];
        const map = new Map();
        for (const a of allocs) {
          const nom = (a && a.chantier && a.chantier.nom) ? String(a.chantier.nom).trim() : '';
          if (!nom) continue;
          const prev = map.get(nom) || 0;
          map.set(nom, prev + Number(a.montant || 0));
        }
        const lines = Array.from(map.entries()).map(([nom, montant]) => ({ nom, montant }));
        if (lines.length) return lines;
        if (c.chantier?.nom) return [{ nom: c.chantier.nom, montant: Number(c.montant || 0) }];
        return [];
      })(),
      chantierNames: (() => {
        const allocs = Array.isArray(c.allocations) ? c.allocations : [];
        const names = allocs
          .map(a => (a && a.chantier && a.chantier.nom) ? String(a.chantier.nom).trim() : '')
          .filter(Boolean);
        if (names.length) return Array.from(new Set(names));
        if (c.chantier?.nom) return [String(c.chantier.nom)];
        return [];
      })(),
      dateEcheance: c.dateEcheance,
      beneficiaire: c.beneficiaire,
      obs: c.obs,
      banque: c.banque?.name || 'Aucun',
      type: 'Chèque',
    })),
    ...effets.map(e => ({
      id: e.id,
      numero: e.numero,
      dateEtablissement: e.dateEtablissement,
      montant: e.montant,
      chantier: (() => {
        const allocs = Array.isArray(e.allocations) ? e.allocations : [];
        const names = allocs
          .map(a => (a && a.chantier && a.chantier.nom) ? String(a.chantier.nom).trim() : '')
          .filter(Boolean);
        if (names.length) return Array.from(new Set(names)).join(', ');
        return e.chantier?.nom || 'Aucun';
      })(),
      chantierLines: (() => {
        const allocs = Array.isArray(e.allocations) ? e.allocations : [];
        const map = new Map();
        for (const a of allocs) {
          const nom = (a && a.chantier && a.chantier.nom) ? String(a.chantier.nom).trim() : '';
          if (!nom) continue;
          const prev = map.get(nom) || 0;
          map.set(nom, prev + Number(a.montant || 0));
        }
        const lines = Array.from(map.entries()).map(([nom, montant]) => ({ nom, montant }));
        if (lines.length) return lines;
        if (e.chantier?.nom) return [{ nom: e.chantier.nom, montant: Number(e.montant || 0) }];
        return [];
      })(),
      chantierNames: (() => {
        const allocs = Array.isArray(e.allocations) ? e.allocations : [];
        const names = allocs
          .map(a => (a && a.chantier && a.chantier.nom) ? String(a.chantier.nom).trim() : '')
          .filter(Boolean);
        if (names.length) return Array.from(new Set(names));
        if (e.chantier?.nom) return [String(e.chantier.nom)];
        return [];
      })(),
      dateEcheance: e.dateEcheance,
      beneficiaire: e.beneficiaire,
      obs: e.obs,
      banque: e.banque?.name || 'Aucun',
      type: 'Effet',
    })),
    ...virements.map(v => ({
      id: v.id,
      numero: v.designation || 'Aucun',
      dateEtablissement: v.date,
      montant: v.montant,
      chantier: (() => {
        const allocs = Array.isArray(v.allocations) ? v.allocations : [];
        const names = allocs
          .map(a => (a && a.chantier && a.chantier.nom) ? String(a.chantier.nom).trim() : '')
          .filter(Boolean);
        if (names.length) return Array.from(new Set(names)).join(', ');
        return v.chantier?.nom || 'Aucun';
      })(),
      chantierLines: (() => {
        const allocs = Array.isArray(v.allocations) ? v.allocations : [];
        const map = new Map();
        for (const a of allocs) {
          const nom = (a && a.chantier && a.chantier.nom) ? String(a.chantier.nom).trim() : '';
          if (!nom) continue;
          const prev = map.get(nom) || 0;
          map.set(nom, prev + Number(a.montant || 0));
        }
        const lines = Array.from(map.entries()).map(([nom, montant]) => ({ nom, montant }));
        if (lines.length) return lines;
        if (v.chantier?.nom) return [{ nom: v.chantier.nom, montant: Number(v.montant || 0) }];
        return [];
      })(),
      chantierNames: (() => {
        const allocs = Array.isArray(v.allocations) ? v.allocations : [];
        const names = allocs
          .map(a => (a && a.chantier && a.chantier.nom) ? String(a.chantier.nom).trim() : '')
          .filter(Boolean);
        if (names.length) return Array.from(new Set(names));
        if (v.chantier?.nom) return [String(v.chantier.nom)];
        return [];
      })(),
      dateEcheance: v.date,
      beneficiaire: v.beneficiaire,
      obs: v.obs,
      banque: v.banque?.name || 'Aucun',
      type: 'Virement',
    })),
    ...miseadis.map(m => ({
      id: m.id,
      numero: 'Aucun',
      dateEtablissement: m.date,
      montant: m.montant,
      chantier: (() => {
        const allocs = Array.isArray(m.allocations) ? m.allocations : [];
        const names = allocs
          .map(a => (a && a.chantier && a.chantier.nom) ? String(a.chantier.nom).trim() : '')
          .filter(Boolean);
        if (names.length) return Array.from(new Set(names)).join(', ');
        return m.chantier?.nom || 'Aucun';
      })(),
      chantierLines: (() => {
        const allocs = Array.isArray(m.allocations) ? m.allocations : [];
        const map = new Map();
        for (const a of allocs) {
          const nom = (a && a.chantier && a.chantier.nom) ? String(a.chantier.nom).trim() : '';
          if (!nom) continue;
          const prev = map.get(nom) || 0;
          map.set(nom, prev + Number(a.montant || 0));
        }
        const lines = Array.from(map.entries()).map(([nom, montant]) => ({ nom, montant }));
        if (lines.length) return lines;
        if (m.chantier?.nom) return [{ nom: m.chantier.nom, montant: Number(m.montant || 0) }];
        return [];
      })(),
      chantierNames: (() => {
        const allocs = Array.isArray(m.allocations) ? m.allocations : [];
        const names = allocs
          .map(a => (a && a.chantier && a.chantier.nom) ? String(a.chantier.nom).trim() : '')
          .filter(Boolean);
        if (names.length) return Array.from(new Set(names));
        if (m.chantier?.nom) return [String(m.chantier.nom)];
        return [];
      })(),
      dateEcheance: m.date,
      beneficiaire: m.beneficiaire,
      obs: m.obs,
      banque: m.banque?.name || 'Aucun',
      type: 'Mise à disposition',
    })),
    ...telepaimentPrelevement.map(t => ({
      id: t.id,
      numero: 'Aucun',
      dateEtablissement: t.dateEtablissement,
      montant: t.montant,
      chantier: t.chantier?.nom || 'Aucun',
      chantierLines: [],
      chantierNames: t.chantier?.nom ? [String(t.chantier.nom)] : [],
      dateEcheance: null,
      beneficiaire: t.fournisseur?.name || 'Aucun',
      obs: t.observation,
      banque: t.banque?.name || 'Aucun',
      type: t.type || 'télépaiment',
    })),
  ];

  historique.sort((a, b) => new Date(b.dateEtablissement) - new Date(a.dateEtablissement));
  return historique;
};

const normalize = (v) => String(v || '').trim().toLowerCase();

const EXCEL_NUMFMT_FR = '[$-040C]#,##0.00';

const formatFrNumber = (n) => Number(n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/\u202F/g, ' ');

export const exportHistoriquePdf = async (req, res) => {
  let browser;
  try {
    const filters = {
      type: normalize(req.query.type),
      fournisseur: normalize(req.query.fournisseur),
      banque: normalize(req.query.banque),
      chantier: normalize(req.query.chantier),
      dateFrom: req.query.dateFrom ? new Date(String(req.query.dateFrom)) : null,
      dateTo: req.query.dateTo ? new Date(String(req.query.dateTo)) : null,
    };

    const allOps = await buildHistoriqueOperations();

    const filtered = allOps.filter(op => {
      const rowType = normalize(op.type);
      const rowFournisseur = normalize(op.beneficiaire);
      const rowBanque = normalize(op.banque);
      const rowChantiers = Array.isArray(op.chantierNames)
        ? op.chantierNames.map(normalize)
        : normalize(op.chantier).split('|').map(s => s.trim()).filter(Boolean);
      const d = op.dateEtablissement ? new Date(op.dateEtablissement) : null;

      const okType = !filters.type || rowType === filters.type;
      const okFourn = !filters.fournisseur || rowFournisseur.includes(filters.fournisseur);
      const okBanque = !filters.banque || rowBanque.includes(filters.banque);
      const okChantier = !filters.chantier || rowChantiers.includes(filters.chantier);
      const okFrom = !filters.dateFrom || (d && d >= filters.dateFrom);
      const okTo = !filters.dateTo || (d && d <= filters.dateTo);
      return okType && okFourn && okBanque && okChantier && okFrom && okTo;
    });

    const totalMontant = filtered.reduce((acc, op) => acc + Number(op.montant || 0), 0);
    const totalChantier = filters.chantier
      ? filtered.reduce((acc, op) => {
        const lines = Array.isArray(op.chantierLines) ? op.chantierLines : [];
        const match = lines.find(l => normalize(l.nom) === filters.chantier);
        return acc + Number(match?.montant || 0);
      }, 0)
      : 0;

    const escapeHtml = (s) => String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    const rowsHtml = filtered.map((op) => {
      const date = op.dateEtablissement ? new Date(op.dateEtablissement) : null;
      const dateEch = op.dateEcheance ? new Date(op.dateEcheance) : null;
      const chantierLines = Array.isArray(op.chantierLines) ? op.chantierLines : [];

      let chantierCell = '';
      let montantChantierCell = '';
      if (filters.chantier) {
        const match = chantierLines.find(l => normalize(l.nom) === filters.chantier);
        if (match) {
          chantierCell = match.nom;
          montantChantierCell = formatFrNumber(match.montant || 0);
        } else {
          chantierCell = '';
          montantChantierCell = formatFrNumber(0);
        }
      } else if (chantierLines.length) {
        chantierCell = chantierLines.map(l => l.nom).join('\n');
        montantChantierCell = chantierLines.map(l => formatFrNumber(l.montant || 0)).join('\n');
      } else {
        chantierCell = op.chantier || '';
        montantChantierCell = '';
      }

      return `
        <tr>
          <td>${escapeHtml(date ? date.toLocaleDateString('fr-FR') : '')}</td>
          <td>${escapeHtml(op.type || '')}</td>
          <td>${escapeHtml(op.numero || '')}</td>
          <td>${escapeHtml(op.banque || '')}</td>
          <td>${escapeHtml(op.beneficiaire || '')}</td>
          <td class="num">${escapeHtml(formatFrNumber(op.montant || 0))}</td>
          <td>${escapeHtml(dateEch ? dateEch.toLocaleDateString('fr-FR') : '')}</td>
          <td class="wrap">${escapeHtml(chantierCell)}</td>
          <td class="num wrap">${escapeHtml(montantChantierCell)}</td>
          <td class="wrap">${escapeHtml(op.obs || '')}</td>
        </tr>`;
    }).join('\n');

    const filtersLabel = [
      filters.type ? `Type: ${filters.type}` : null,
      filters.fournisseur ? `Fournisseur: ${filters.fournisseur}` : null,
      filters.banque ? `Banque: ${filters.banque}` : null,
      filters.chantier ? `Chantier: ${filters.chantier}` : null,
      filters.dateFrom ? `Du: ${filters.dateFrom.toLocaleDateString('fr-FR')}` : null,
      filters.dateTo ? `Au: ${filters.dateTo.toLocaleDateString('fr-FR')}` : null,
    ].filter(Boolean).join(' | ');

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            @page { size: A4 landscape; margin: 14mm; }
            body { font-family: Arial, Helvetica, sans-serif; font-size: 10px; color: #111; }
            h1 { font-size: 14px; margin: 0 0 6px 0; }
            .meta { font-size: 10px; color: #555; margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 5px 6px; vertical-align: top; }
            th { background: #f3f4f6; font-weight: 700; }
            td.num { text-align: right; white-space: nowrap; }
            td.wrap { white-space: pre-wrap; }
            tfoot td { font-weight: 700; background: #fafafa; }
          </style>
        </head>
        <body>
          <h1>Historique des opérations</h1>
          <div class="meta">
            ${escapeHtml(filtersLabel || 'Aucun filtre')}
            <br />
            ${escapeHtml(`${filtered.length} résultat(s)`) }
          </div>

          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Numéro</th>
                <th>Banque</th>
                <th>Bénéficiaire</th>
                <th>Montant</th>
                <th>Date Échéance</th>
                <th>Chantier</th>
                <th>Montant chantier</th>
                <th>Observation</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="5">Total</td>
                <td class="num">${escapeHtml(formatFrNumber(totalMontant))}</td>
                <td colspan="4"></td>
              </tr>
              ${filters.chantier ? `
                <tr>
                  <td colspan="7"></td>
                  <td colspan="1">Total chantier</td>
                  <td class="num">${escapeHtml(formatFrNumber(totalChantier))}</td>
                  <td></td>
                </tr>` : ''}
            </tfoot>
          </table>
        </body>
      </html>
    `;

    browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: { top: '14mm', right: '14mm', bottom: '14mm', left: '14mm' }
    });

    const filename = `historique_operations_${new Date().toISOString().slice(0, 10)}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).send('Erreur serveur.');
  } finally {
    if (browser) {
      try { await browser.close(); } catch { /* ignore */ }
    }
  }
};

export const exportHistoriqueExcel = async (req, res) => {
  try {
    // pageSize is kept for backward compatibility with the UI, but export is not paginated.
    const filters = {
      type: normalize(req.query.type),
      fournisseur: normalize(req.query.fournisseur),
      banque: normalize(req.query.banque),
      chantier: normalize(req.query.chantier),
      dateFrom: req.query.dateFrom ? new Date(String(req.query.dateFrom)) : null,
      dateTo: req.query.dateTo ? new Date(String(req.query.dateTo)) : null,
    };

    const allOps = await buildHistoriqueOperations();

    const filtered = allOps.filter(op => {
      const rowType = normalize(op.type);
      const rowFournisseur = normalize(op.beneficiaire);
      const rowBanque = normalize(op.banque);
      const rowChantiers = Array.isArray(op.chantierNames)
        ? op.chantierNames.map(normalize)
        : normalize(op.chantier).split('|').map(s => s.trim()).filter(Boolean);
      const d = op.dateEtablissement ? new Date(op.dateEtablissement) : null;

      const okType = !filters.type || rowType === filters.type;
      const okFourn = !filters.fournisseur || rowFournisseur.includes(filters.fournisseur);
      const okBanque = !filters.banque || rowBanque.includes(filters.banque);
      const okChantier = !filters.chantier || rowChantiers.includes(filters.chantier);
      const okFrom = !filters.dateFrom || (d && d >= filters.dateFrom);
      const okTo = !filters.dateTo || (d && d <= filters.dateTo);
      return okType && okFourn && okBanque && okChantier && okFrom && okTo;
    });

    const totalMontant = filtered.reduce((acc, op) => acc + Number(op.montant || 0), 0);
    const totalChantier = filters.chantier
      ? filtered.reduce((acc, op) => {
        const lines = Array.isArray(op.chantierLines) ? op.chantierLines : [];
        const match = lines.find(l => normalize(l.nom) === filters.chantier);
        return acc + Number(match?.montant || 0);
      }, 0)
      : 0;

    const headers = [
      'Date',
      'Type',
      'Numéro',
      'Banque',
      'Bénéficiaire',
      'Montant',
      'Date Échéance',
      'Chantier',
      'Montant chantier',
      'Observation'
    ];

    const wb = new ExcelJS.Workbook();
    wb.creator = 'Confonda';
    wb.created = new Date();

    const sheet = wb.addWorksheet('Historique');
    sheet.addRow(headers);

    // column widths
    sheet.columns = [
      { width: 15 },
      { width: 16 },
      { width: 16 },
      { width: 18 },
      { width: 30 },
      { width: 20 },
      { width: 15 },
      { width: 30 },
      { width: 22 },
      { width: 35 },
    ];

    // header style
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).alignment = { vertical: 'middle' };

    // Apply monetary format at the column level.
    sheet.getColumn(6).numFmt = EXCEL_NUMFMT_FR;
    sheet.getColumn(6).alignment = { horizontal: 'right' };
    sheet.getColumn(9).numFmt = EXCEL_NUMFMT_FR;
    sheet.getColumn(9).alignment = { horizontal: 'right' };

    for (const op of filtered) {
      const date = op.dateEtablissement ? new Date(op.dateEtablissement) : null;
      const dateEch = op.dateEcheance ? new Date(op.dateEcheance) : null;
      const chantierLines = Array.isArray(op.chantierLines) ? op.chantierLines : [];

      // Keep Excel amounts as NUMBERS (not strings) in all cases.
      // If there are multiple chantier allocations, export one row per chantier line.
      const exportLines = (() => {
        if (filters.chantier) {
          const match = chantierLines.find(l => normalize(l.nom) === filters.chantier);
          return [{ nom: match?.nom || '', montant: Number(match?.montant || 0) }];
        }
        if (chantierLines.length) {
          return chantierLines.map(l => ({ nom: l.nom || '', montant: Number(l.montant || 0) }));
        }
        return [{ nom: op.chantier || '', montant: null }];
      })();

      exportLines.forEach((ln, idx) => {
        const isFirst = idx === 0;
        const montantNum = isFirst ? Number(op.montant || 0) : null;
        const montantChNum = (ln.montant === null || ln.montant === undefined) ? null : Number(ln.montant || 0);

        const row = sheet.addRow([
          isFirst ? (date ? date.toLocaleDateString('fr-FR') : '') : '',
          isFirst ? (op.type || '') : '',
          isFirst ? (op.numero || '') : '',
          isFirst ? (op.banque || '') : '',
          isFirst ? (op.beneficiaire || '') : '',
          montantNum,
          isFirst ? (dateEch ? dateEch.toLocaleDateString('fr-FR') : '') : '',
          ln.nom || '',
          montantChNum,
          isFirst ? (op.obs || '') : '',
        ]);

        // numeric formatting
        const montantCell = row.getCell(6);
        if (montantCell && typeof montantCell.value === 'number') {
          montantCell.numFmt = EXCEL_NUMFMT_FR;
          montantCell.alignment = { horizontal: 'right' };
        }

        const montantChantierCell = row.getCell(9);
        if (montantChantierCell && typeof montantChantierCell.value === 'number') {
          montantChantierCell.numFmt = EXCEL_NUMFMT_FR;
          montantChantierCell.alignment = { horizontal: 'right' };
        } else {
          montantChantierCell.alignment = { horizontal: 'right' };
        }

        row.getCell(8).alignment = { vertical: 'top' };
      });
    }

    // totals at the bottom
    sheet.addRow([]);
    const totalRow = sheet.addRow(['', '', '', '', 'Total', totalMontant, '', '', '', '']);
    totalRow.font = { bold: true };
    totalRow.getCell(6).numFmt = EXCEL_NUMFMT_FR;
    totalRow.getCell(6).alignment = { horizontal: 'right' };

    if (filters.chantier) {
      const totalChRow = sheet.addRow(['', '', '', '', '', '', '', 'Total chantier', totalChantier, '']);
      totalChRow.font = { bold: true };
      totalChRow.getCell(9).numFmt = EXCEL_NUMFMT_FR;
      totalChRow.getCell(9).alignment = { horizontal: 'right' };
    }

    const filename = `historique_operations_${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).send('Erreur serveur.');
  }
};


export const updateHistoryBanque = async (req, res) => {
  try {
    const { positive, negative, dmlt, banqueId } = req.body;

    // Function to parse French-formatted numbers
    const parseFrenchNumber = (value) => {
      if (value === "" || value == null) return null; // Preserve null/empty values
      // Remove spaces, replace comma with dot, and parse as float
      return parseFloat(value.replace(/\s/g, '').replace(',', '.'));
    };

    // Ensure all arrays are aligned
    const updates = banqueId.map((id, index) => {
      let data = {};

      // Only update fields that have valid values
      if (positive[index] !== "" && positive[index] != null) {
        data.positive = parseFrenchNumber(positive[index]);
      }
      if (negative[index] !== "" && negative[index] != null) {
        data.negative = parseFrenchNumber(negative[index]);
      }
      if (dmlt[index] !== "" && dmlt[index] != null) {
        data.dmlt = parseFrenchNumber(dmlt[index]);
      }

      return {
        id: parseInt(id),
        data,
      };
    });

    // Run updates in parallel
    await Promise.all(
      updates.map(b =>
        prisma.banque.update({
          where: { id: b.id },
          data: b.data,
        })
      )
    );

    res.redirect('/tresorerie/historique');
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la situation bancaire.' });
  }
};




export const saveEncaissement = async (req, res) => {
  try {
    const {
      id,
      dateEtablissement,
      banqueId,
      chantierId,
      clientId,
      montant,
      observation,
      type,
      nDeFactureRG,
      RG,
      Ras_TVA,
      Autres,
      ResteAPayer
    } = req.body;

    if (!dateEtablissement || !banqueId || !clientId || !montant) {
      return res.status(400).json({ message: 'Champs obligatoires manquants' });
    }

    if (id) {
      // Update existing encaissement
      const updated = await prisma.encaissementRecu.update({
        where: { id: Number(id) },
        data: {
          dateEtablissement: new Date(dateEtablissement),
          banqueId: Number(banqueId),
          chantierId: chantierId ? Number(chantierId) : null,
          clientId: Number(clientId),
          montant: parseFloat(montant),
          observation,
          type,
          nDeFactureRG,
          RG,
          Ras_TVA,
          Autres,
          ResteAPayer
        }
      });
      res.json({ message: 'Encaissement mis à jour avec succès', encaissement: updated });
    } else {
      // Create new encaissement
      const newEncaissement = await prisma.encaissementRecu.create({
        data: {
          dateEtablissement: new Date(dateEtablissement),
          banqueId: Number(banqueId),
          chantierId: chantierId ? Number(chantierId) : null,
          clientId: Number(clientId),
          montant: parseFloat(montant),
          observation,
          type,
          nDeFactureRG,
          RG,
          Ras_TVA,
          Autres,
          ResteAPayer
        }
      });
      res.json({ message: 'Encaissement ajouté', encaissement: newEncaissement });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Delete an encaissement
export const deleteEncaissement = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'ID manquant' });

    await prisma.encaissementRecu.delete({ where: { id: Number(id) } });
    res.json({ message: 'Encaissement supprimé avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

