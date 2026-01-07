import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';

import prisma from '../db.js';
import { storeBc } from '../controllers/bcController.js';

const createSpy = (impl) => {
  const calls = [];
  const spy = async (...args) => {
    calls.push(args);
    return impl(...args);
  };
  spy.calls = calls;
  return spy;
};

const createRes = () => {
  return {
    statusCode: 200,
    jsonBody: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.jsonBody = body;
      return this;
    },
  };
};

const originalBondeCommandeCreate = prisma?.bondeCommande?.create;
const originalBondeCommandeChantierItemCreate = prisma?.bondeCommandeChantierItem?.create;

afterEach(() => {
  if (originalBondeCommandeCreate) prisma.bondeCommande.create = originalBondeCommandeCreate;
  if (originalBondeCommandeChantierItemCreate) prisma.bondeCommandeChantierItem.create = originalBondeCommandeChantierItemCreate;
});

test('storeBc returns 400 when supplier is invalid', async () => {
  const req = {
    body: {
      supplier: 'abc',
      date: '2026-01-05',
      commandesItems: [],
    },
  };
  const res = createRes();

  await storeBc(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.jsonBody?.success, false);
  assert.equal(res.jsonBody?.error, 'Fournisseur invalide');
});

test('storeBc returns 400 when date is invalid', async () => {
  const req = {
    body: {
      supplier: '1',
      date: 'not-a-date',
      commandesItems: [],
    },
  };
  const res = createRes();

  await storeBc(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.jsonBody?.success, false);
  assert.equal(res.jsonBody?.error, 'Date invalide');
});

test('storeBc creates BC and distribution and returns success', async () => {
  const bondeCommandeCreate = createSpy(async (args) => {
    return {
      ...args?.data,
      id: 123,
      fournisseur: { id: 1 },
      commandesItems: [
        {
          id: 10,
          designation: 'Ciment',
        },
      ],
    };
  });

  const chantierItemCreate = createSpy(async () => ({ id: 999 }));

  prisma.bondeCommande.create = bondeCommandeCreate;
  prisma.bondeCommandeChantierItem.create = chantierItemCreate;

  const req = {
    body: {
      supplier: '1',
      date: '2026-01-05',
      dateLivraison: '2026-01-06',
      lieuLivraison: 'Depot',
      modeReg: 'Virement',
      delaiReg: '30j',
      montantLettre: 'cent',
      tauxTva: '20',
      commandesItems: [
        {
          designation: 'Ciment',
          unite: 'sac',
          reference: 'REF1',
          quantite: '2',
          prixUnitaire: '100',
          montantRemise: '10',
          tauxRemise: '0',
          imputation: 'A1',
          chantierDistribution: [{ chantierId: '2', qty: '2', montant: '190' }],
        },
      ],
    },
  };

  const res = createRes();

  await storeBc(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.jsonBody?.success, true);
  assert.equal(res.jsonBody?.bc?.id, 123);

  assert.equal(bondeCommandeCreate.calls.length, 1);
  const [createArg] = bondeCommandeCreate.calls[0];

  assert.ok(createArg?.data?.date instanceof Date);
  assert.equal(createArg?.data?.totalHt, 190);
  assert.equal(createArg?.data?.tauxTva, 20);
  assert.equal(createArg?.data?.totalTtc, 228);

  assert.equal(chantierItemCreate.calls.length, 1);
  const [distArg] = chantierItemCreate.calls[0];
  assert.deepEqual(distArg, {
    data: {
      bondeCommandeId: 123,
      itemId: 10,
      chantierId: 2,
      qty: 2,
      montant: 190,
    },
  });
});

test('storeBc returns 500 when prisma create fails', async () => {
  prisma.bondeCommande.create = createSpy(async () => {
    throw new Error('db error');
  });

  const req = {
    body: {
      supplier: '1',
      date: '2026-01-05',
      commandesItems: [{ designation: 'Ciment', quantite: '1', prixUnitaire: '1' }],
    },
  };

  const res = createRes();

  await storeBc(req, res);

  assert.equal(res.statusCode, 500);
  assert.equal(res.jsonBody?.success, false);
  assert.equal(res.jsonBody?.error, 'Erreur serveur');
});
