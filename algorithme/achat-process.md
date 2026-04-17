# Processus d'Achat - Flux Métier

## Vue d'ensemble

Le processus d'achat dans le BTP suit un flux standardisé de 4 documents principaux qui garantissent la traçabilité et le contrôle financier.

---

## Les 4 Documents du Processus

### 1. Bon de Commande (BC)
**Qu'est-ce que c'est ?**
Document officiel envoyant une demande au fournisseur pour commander des matériaux ou services.

**Contenu :**
- Numéro de commande (ex: 0036/2026)
- Fournisseur sélectionné
- Liste des articles avec quantités et prix
- Chantier destinataire
- Date de livraison souhaitée
- Conditions de paiement

**Quand est-il créé ?**
- Lors d'une demande de fourniture validée
- Création manuelle directe
- Import depuis Excel

---

### 2. Bon de Livraison (BL)
**Qu'est-ce que c'est ?**
Document reçu avec les marchandises confirmant la livraison réelle.

**Contenu :**
- Numéro BL fournisseur
- Référence au BC d'origine
- Liste des articles livrés vs commandés
- Dates de réception
- Signature du réceptionnaire

**Quand est-il créé ?**
- Lors de la réception des marchandises
- Peut être :
  - **Complet** : Toutes les quantités livrées
  - **Partiel** : Quantités partielles (donc plusieurs BL pour un BC)

**Statuts possibles :**
- En attente
- Reçu
- Annulé

---

### 3. Facture
**Qu'est-ce que c'est ?**
Document fiscal du fournisseur réclamant le paiement.

**Contenu :**
- Numéro de facture fournisseur
- Référence au(x) BL
- Montant HT, TVA, TTC
- Date d'échéance de paiement
- Mode de règlement

**Quand est-elle créée ?**
- Après réception du BL
- Peut être liée à :
  - Un seul BL
  - Plusieurs BL du même fournisseur

**Statuts possibles :**
- Non payée
- Partiellement payée
- Payée

---

### 4. Facture Avoir (Avoir / Credit Note)
**Qu'est-ce que c'est ?**
Document réduisant le montant dû au fournisseur.

**Contenu :**
- Numéro d'avoir
- Raison de l'avoir (retour, rabais, erreur)
- Montant crédité
- Référence à la facture d'origine

**Quand est-elle créée ?**
- Retour de marchandises
- Remise commerciale accordée
- Erreur de facturation
- Prix différent du devis

---

## Flux Complet (Diagramme)

```
[Demande Fourniture]
         |
         v
   [Bon de Commande] ----> Envoyé au fournisseur
         |
         | (Réception marchandises)
         v
   [Bon de Livraison] ----> Réception + Contrôle
         |                        |
         | (Facturation)          | (Partial)
         v                         |
   [Facture] <---------------------+
         |
         | (Paiement)
         v
   [Payée]
         |
         | (Éventuel)
         v
   [Facture Avoir] (si retour/rabais)
```

---

## Exemple Concret

**Scenario :** Commande de 100 tuiles pour le chantier "Résidence Al Amal"

| Étape | Document | Détail |
|-------|----------|--------|
| 1 | BC #0036/2026 | Commandé 100 tuiles à 15DH l'unité |
| 2 | BL #BL-001 | Livré 80 tuiles (partiel) |
| 3 | BL #BL-002 | Livré 20 tuiles restantes |
| 4 | Facture #FAC-2026-045 | Facturé pour 100 tuiles |
| 5 | Facture Avoir #AV-001 | 5 tuiles cassées = avoir de 75DH |
| 6 | Payée | Solde après avoir |

---

## Règles Métier

1. **BC obligatoire avant BL** : Chaque livraison doit être liée à un BC
2. **BL obligatoire avant Facture** : On ne facture que ce qui est livré
3. **Facture peut grouper plusieurs BL** : Regroupement par fournisseur/période
4. **Avoir toujours lié à une Facture** : Réduit le montant dû
5. **Traçabilité complète** : Chaque document doit pouvoir remonter au précédent

---

## Statuts des Documents

### Bon de Commande
- `en_attente_bl` - En attente de livraison
- `partiel` - Livraison partielle reçue
- `livre` - Complètement livré

### Bon de Livraison
- `en_attente` - En attente de réception
- `receptionne` - Marchandises réceptionnées
- `Annulé` - BL annulé

### Facture
- `non_payee` - En attente de paiement
- `partiellement_payee` - Paiement en cours
- `payee` - Réglée intégralement

---

## Résumé

```
BC (Commande) --> BL (Livraison) --> Facture (Paiement) --> [Avoir (Optionnel)]
     |                |                   |
   "Je veux"       "Voici ce que      "Combien je dois"
                   j'ai livré"         "payer"
```

Ce flux garantit :
- Un contrôle à chaque étape
- Une traçabilité complète
- Une gestion financière précise
