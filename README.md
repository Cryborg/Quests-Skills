# 🎮 Quests&Skills

Plateforme de collection de cartes gamifiée avec système de quêtes mathématiques.

Version moderne avec base de données SQLite/Turso et architecture modulaire.

## 🚀 Déploiement

**Production**: Déployé sur Vercel + Turso
**Voir**: [DEPLOYMENT.md](./DEPLOYMENT.md) pour les instructions détaillées

## 🏗️ Architecture

### Backend (Node.js + Express)
```
server/
├── index.js           # Serveur Express principal
└── routes/
    ├── auth.js        # Authentification
    ├── cards.js       # Gestion des cartes
    ├── users.js       # Gestion users et crédits
    └── bonus.js       # Opérations bonus
```

### Frontend (Modules)
```
js/
├── core/
│   ├── Database.js    # Wrapper API (appels fetch)
│   ├── Auth.js        # Authentification client
│   └── Module.js      # Classe abstraite pour modules
├── modules/
│   ├── CardsModule.js      # Gestion collection de cartes
│   └── BonusModule.js      # Système bonus maths
└── app-new.js              # Orchestrateur principal
```

### Base de données (Prisma + SQLite)
```
prisma/
├── schema.prisma      # Schéma de la base
├── migrations/        # Migrations SQL
└── seed.js           # Données initiales
```

## 🚀 Démarrage

### 1. Installation
```bash
npm install
```

### 2. Base de données
```bash
# Créer et migrer la base
npx prisma migrate dev

# Peupler avec les données initiales
npm run seed
```

### 3. Lancer le serveur
```bash
npm run dev
# Serveur disponible sur http://localhost:3000
```

## 📊 Base de données

### Tables principales

- **users** : Utilisateurs du système
- **cards** : Définition des cartes (24 cartes : Minecraft, Dinosaures, Espace)
- **user_cards** : Relation user ↔ cartes avec quantité
- **user_credits** : Crédits de pioche par user
- **bonus_operations** : Configuration des opérations (addition, soustraction, multiplication)
- **operation_attempts** : Historique des tentatives avec exercices et réponses

### Conventions Laravel

- Noms de tables en **snake_case** et au pluriel (`user_cards`)
- Champs en **snake_case** (`created_at`, `user_id`)
- Timestamps automatiques (`created_at`, `updated_at`)
- Soft deletes si nécessaire
- Clés étrangères avec `onDelete: Cascade`

## 🔌 API Endpoints

### Cards
- `GET /api/cards` - Liste des cartes
- `GET /api/cards/:id` - Détails d'une carte

### Users
- `GET /api/users/:id` - Infos user
- `GET /api/users/:id/cards` - Cartes d'un user
- `POST /api/users/:id/cards` - Ajouter une carte
- `GET /api/users/:id/credits` - Crédits d'un user
- `POST /api/users/:id/credits` - Ajouter des crédits
- `POST /api/users/:id/credits/use` - Utiliser des crédits
- `GET /api/users/:id/attempts` - Historique des tentatives
- `POST /api/users/:id/attempts` - Enregistrer une tentative

### Bonus Operations
- `GET /api/bonus-operations` - Liste des opérations

### Auth
- `GET /api/auth/me` - User courant
- `POST /api/auth/login` - Login (TODO)
- `POST /api/auth/register` - Register (TODO)
- `POST /api/auth/logout` - Logout (TODO)

## 🧩 Modules

### CardsModule
Gère la collection de cartes :
- Affichage de la grille de cartes
- Filtres (catégorie, rareté)
- Pioche de cartes
- Animation de carte tirée

### BonusModule
Gère le système de bonus mathématiques :
- Sélection d'opération (addition, soustraction, multiplication)
- Génération d'exercices
- Validation des réponses
- Attribution des récompenses
- Limite de 3 essais par type par jour

## 🔧 Debug Mode

En mode développement (`localhost`), des outils de debug sont disponibles :

```javascript
// Console du navigateur
DEBUG.addCredits(10)        // Ajouter 10 crédits
DEBUG.showStats()           // Afficher les stats
DEBUG.app                   // Accéder à l'app
DEBUG.modules.cards         // Accéder au module cards
```

## 📝 TODO

- [ ] Système d'authentification complet (login/register)
- [ ] Sessions/JWT
- [ ] Migration des données localStorage → SQLite
- [ ] Tests unitaires
- [ ] Docker pour déploiement
- [ ] Migration MySQL en production

## 🎯 Prochaines étapes

1. **Tests** : Tester le système actuel
2. **Migration** : Script pour importer les données localStorage existantes
3. **Auth** : Implémenter le système d'authentification complet
4. **Production** : Préparer pour MySQL et déploiement

## 💡 Nouvelles Idées de Modules Bonus

### Jeux de Lettres
- **Mots fléchés** : Grille de mots croisés simplifiée avec indices
- **Mots mêlés** : Grille de lettres où trouver des mots cachés
- **Codage/Décodage** : Utiliser un code secret simple (alphabet morse simplifié, code lettre/symbole) pour déchiffrer un mot ou une phrase

### Logique et Nombres
- **Suite logique de nombres** : Compléter une suite numérique (ex: 2, 4, 6, ?, 10)
- **Sudokus simples** : Grilles 4x4 ou 6x6 adaptées aux enfants
- **Problèmes de Logique Junior** : Courtes énigmes qui nécessitent de lire et de déduire
  - Exemple: "Qui a le chien, sachant que Marie n'a pas le chat et que Paul n'a pas le poisson ?"

### Compétences Pratiques
- **Lecture de l'heure** :
  - Lire l'heure sur une horloge analogique
  - Reproduire une heure digitale sur une horloge analogique (placer les aiguilles)
- **Déplacement sur Quadrillage** : Programmer le déplacement d'un personnage avec des flèches directionnelles pour atteindre un objectif
  - Introduction à la pensée algorithmique
  - Séquences de commandes (avancer, tourner à gauche/droite)
