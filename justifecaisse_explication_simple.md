# JustifCaisse (Justification de Caisse) - Explication Simple

## Qu'est-ce que c'est ?

Le **JustifCaisse** est un système de gestion de caisse (argent) pour les chantiers de construction. C'est comme un carnet de comptes qui suit l'argent qui entre et qui sort.

## Concept de Base

Imaginez une caisse dans un chantier :
- **L'argent rentre** (Recettes) = Quelqu'un met de l'argent dans la caisse
- **L'argent sort** (Dépenses) = On achète du matériel, on paie des factures
- **Le solde** = L'argent restant dans la caisse

## Les Éléments Principaux

### 1. La Justification (JustifCaisse)
C'est un document mensuel qui regroupe :
- **Le mois** (ex: Janvier 2025)
- **Le chantier** concerné
- **Le responsable** (qui gère la caisse)
- **Le solde précédent** (argent resté du mois dernier)

### 2. Les Recettes (Argent qui entre)
Quand quelqu'un ajoute de l'argent à la caisse :
- Date de la recette
- Source (qui donne l'argent ?)
- Montant

### 3. Les Dépenses (Argent qui sort)
Quand on dépense de l'argent :
- Date de la dépense
- Numéro de pièce justificative (facture, reçu)
- Nature de la dépense (pour quoi ?)
- Montant justifié (avec facture)
- Montant non justifié (sans facture)
- Validation (admin approuve ou non)

### 4. Le Calcul du Solde
```
Solde Final = Solde Précédent + Total Recettes - Total Dépenses
```

Exemple :
- Solde du mois dernier : 10 000 DH
- Recettes ce mois : +5 000 DH
- Dépenses ce mois : -3 000 DH
- **Solde Final : 12 000 DH**

## Le Processus Mensuel

1. **Début du mois** : Le système crée automatiquement une nouvelle justification
2. **Pendant le mois** : Le responsable ajoute les recettes et dépenses
3. **Fin du mois** : 
   - L'administrateur valide les dépenses
   - Le système génère un PDF/Excel
   - Le solde final devient le solde précédent du mois suivant

## Qui fait quoi ?

### Le Responsable de Caisse (Utilisateur)
- Crée les justifications
- Ajoute les recettes
- Ajoute les dépenses
- Upload les pièces justificatives (images)

### L'Administrateur
- Valide ou refuse les dépenses
- Voir toutes les caisses de tous les utilisateurs
- Génère les rapports PDF/Excel
- Peut créer des justifications pour les utilisateurs

## Notifications WhatsApp

Quand quelqu'un modifie une dépense, le système envoie automatiquement un message WhatsApp aux administrateurs avec :
- Qui a fait la modification
- Quel chantier
- Quels changements exacts
- Un PDF en pièce jointe

## Les Rapports

### PDF
Un document officiel avec :
- Logo de l'entreprise
- Informations du responsable et chantier
- Tableau des recettes
- Tableau des dépenses
- Totaux calculés
- Pied de page professionnel

### Excel
Un fichier tableur pour :
- Analyser les données
- Filtres et tris
- Calculs personnalisés

## Sécurité

- Chaque utilisateur ne voit QUE ses propres caisses
- L'administrateur voit tout
- Les modifications sont tracées (qui, quoi, quand)
- Validation obligatoire pour les dépenses

## En Résumé

C'est un **carnet de caisse digital** qui :
1. Suit l'argent du chantier mois par mois
2. Garde une trace de tout (qui a mis/enlevé de l'argent)
3. Génère des rapports professionnels
4. Notifie les admins des changements
5. Calcule automatiquement les soldes
