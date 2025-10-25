IMPORTANT: toujours développer de façon modulaire. Je veux pouvoir ajouter ou même retirer/désactiver des fonctionnalités sans que ça n'impacte le reste

# Guide de création d'un nouveau module

## Structure de base

Chaque module doit être dans son propre dossier sous `modules/nom-du-module/` avec cette structure :
```
modules/nom-du-module/
├── index.html
├── js/
│   └── nom-du-module.js
└── css/
    └── nom-du-module.css (optionnel)
```

## Template HTML standard

```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎮 Nom du Module</title>
    <link rel="icon" type="image/png" href="/favicon.png">
    <link rel="stylesheet" href="../../shared/css/theme.css">
    <link rel="stylesheet" href="../../shared/css/navigation.css">
    <link rel="stylesheet" href="../../shared/css/page-header.css">
    <link rel="stylesheet" href="../../shared/css/victory-animation.css">
    <link rel="stylesheet" href="css/nom-du-module.css">
</head>
<body>
    <div class="container">
        <!-- Header injecté automatiquement par PageHeader.render() -->

        <main class="main-content">
            <div class="game-area">
                <!-- Contenu du module ici -->

                <!-- Animation de victoire - DANS la zone de jeu -->
                <div id="victory-overlay" class="victory-overlay">
                    <div class="victory-content">
                        <div class="victory-message">GAGNÉ !</div>
                        <div class="confetti-container" id="confetti-container"></div>
                    </div>
                </div>
            </div>
        </main>

        <!-- Toast pour les notifications -->
        <div id="toast" class="toast"></div>
    </div>

    <!-- Scripts partagés -->
    <script src="../../shared/js/page-header.js"></script>
    <script src="../../shared/js/config.js"></script>
    <script src="../../shared/js/auth.js"></script>
    <script src="../../shared/js/auth-ui.js"></script>
    <script src="../../shared/js/navigation.js"></script>
    <script src="../../shared/js/toast.js"></script>
    <script src="../../shared/js/victory-animation.js"></script>

    <!-- Script du module -->
    <script src="js/nom-du-module.js"></script>

    <!-- Initialisation de l'auth -->
    <script>
        document.addEventListener('DOMContentLoaded', async () => {
            const isAuth = await authService.init();

            if (!isAuth) {
                window.location.href = '/';
            } else {
                await navigationUI.init();
                // Initialiser le module ici
                await moduleGame.init();
            }
        });
    </script>
</body>
</html>
```

## CSS du module

**IMPORTANT** : Le CSS du module doit inclure `position: relative` sur `.game-area` pour l'overlay de victoire :

```css
/* nom-du-module.css */
.game-area {
    position: relative; /* IMPORTANT pour l'overlay de victoire */
}

/* Reste du CSS du module... */
```

## Structure JavaScript du module

```javascript
class MonModule {
    constructor() {
        // Initialiser les variables d'état ici
        this.score = 0;
        this.level = 1;
    }

    async init() {
        // 1. Créer le header avec PageHeader
        PageHeader.render({
            icon: '🎮',
            title: 'Nom du Module',
            subtitle: 'Description du module',
            actions: [] // Boutons optionnels
        });

        // 2. Cacher les éléments DOM
        this.cacheElements();

        // 3. Attacher les événements
        this.attachEvents();

        // 4. Lancer le jeu/module
        this.start();
    }

    cacheElements() {
        this.elements = {
            // Référencer tous les éléments DOM utilisés
        };
    }

    attachEvents() {
        // Attacher tous les event listeners
    }

    async start() {
        // Démarrer la logique du module
    }

    async addCredits(amount) {
        const user = authService.getCurrentUser();
        if (!user) return;

        try {
            await authService.fetchAPI(`/users/${user.id}/credits`, {
                method: 'POST',
                body: JSON.stringify({ amount })
            });
        } catch (error) {
            console.error('Failed to add credits:', error);
        }
    }
}

// Instance globale
const moduleGame = new MonModule();
```

## Composants partagés obligatoires

### 1. PageHeader (Header commun)
Toujours utiliser `PageHeader.render()` pour créer le header :

```javascript
PageHeader.render({
    icon: '🎮',
    title: 'Titre du Module',
    subtitle: 'Description courte',
    actions: [
        { icon: '❓', text: 'Aide', id: 'help-btn' },
        { icon: '🔙', text: 'Retour', id: 'back-btn' }
    ]
});
```

### 2. Navigation (Sidebar commune)
La navigation est automatiquement initialisée par `navigationUI.init()` dans le script d'init.

### 3. Animation de victoire
**IMPORTANT : Pour tout jeu/module, TOUJOURS afficher l'animation de victoire quand l'utilisateur réussit.**

Le système d'animation de victoire est disponible via `shared/js/victory-animation.js` et `shared/css/victory-animation.css`.

**HTML requis :**
```html
<head>
    <!-- ... autres CSS ... -->
    <link rel="stylesheet" href="../../shared/css/victory-animation.css">
</head>
<body>
    <!-- IMPORTANT: L'overlay doit être DANS la zone de jeu, pas à la racine -->
    <main class="main-content">
        <div class="game-area" style="position: relative;">
            <!-- Contenu du jeu ici -->

            <!-- Animation de victoire - DOIT être dans la zone de jeu -->
            <div id="victory-overlay" class="victory-overlay">
                <div class="victory-content">
                    <div class="victory-message">GAGNÉ !</div>
                    <div class="confetti-container" id="confetti-container"></div>
                </div>
            </div>
        </div>
    </main>

    <!-- Scripts -->
    <script src="../../shared/js/victory-animation.js"></script>
</body>
```

**CSS requis :**
Le parent de `#victory-overlay` doit avoir `position: relative` pour que l'overlay couvre uniquement la zone de jeu :
```css
.game-area {
    position: relative; /* IMPORTANT pour l'overlay de victoire */
}
```

**Utilisation en JavaScript :**
```javascript
async handleVictory() {
    // Afficher l'animation de victoire
    VictoryAnimation.show();

    // Calculer et ajouter les crédits
    const credits = this.calculateCredits();
    await this.addCredits(credits);

    // Afficher un toast après l'animation (2 secondes)
    setTimeout(() => {
        Toast.success(`Bravo ! +${credits} crédits`);
    }, 2000);
}
```

### 4. Toast (Notifications)
**IMPORTANT : Ne JAMAIS créer de div feedback custom. TOUJOURS utiliser les toasts.**

Le système de toast est disponible via `shared/js/toast.js` qui est inclus automatiquement.

```javascript
// Utilisation directe
Toast.show('Message personnalisé');
Toast.success('Bravo !');  // Ajoute ✅
Toast.error('Incorrect');  // Ajoute ❌
Toast.info('Information');  // Ajoute ℹ️
Toast.warning('Attention');  // Ajoute ⚠️
Toast.hint('Indice : ...', 4000);  // Ajoute 💡, durée 4s

// Fonction globale rétrocompatible
showToast('✅ Bravo !');
```

### 4. Modales (Alert & Confirm)
**IMPORTANT : Ne JAMAIS utiliser `alert()` ou `confirm()` natifs du navigateur. Le système de modales les remplace automatiquement.**

Le système de modales est disponible via `shared/js/modals.js` qui est chargé automatiquement via `common.js`.

```javascript
// Alert - Utilisation normale, le système override automatiquement window.alert
alert('Message d\'information');
await alert('Message d\'information'); // Peut être await si besoin

// Confirm - Retourne une Promise<boolean>
const confirmed = await confirm('Êtes-vous sûr de vouloir continuer ?');
if (confirmed) {
    // L'utilisateur a cliqué sur "Confirmer"
    console.log('Confirmé !');
} else {
    // L'utilisateur a cliqué sur "Annuler"
    console.log('Annulé');
}

// Exemple pratique
async function deleteUser() {
    const confirmed = await confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?');
    if (!confirmed) return;

    // Procéder à la suppression...
    Toast.success('Utilisateur supprimé');
}
```

Le système :
- Override automatiquement `window.alert()` et `window.confirm()`
- Retourne des Promises (peut être utilisé avec `await`)
- Utilise un style cohérent avec le thème de l'application
- Ferme avec Échap ou en cliquant sur l'overlay
- CSS chargé automatiquement via `@import` dans `theme.css`

### 5. Authentification
L'authentification est gérée automatiquement. Utiliser `authService.getCurrentUser()` pour obtenir l'utilisateur connecté.

### 6. Gestion des essais journaliers
Le système `GameAttempts` (dans `shared/js/game-attempts.js`) gère automatiquement les essais par jour.

```javascript
async init() {
    // Créer le header avec les stats d'essais restants
    PageHeader.render({
        icon: '🎮',
        title: 'Mon Module',
        subtitle: 'Description',
        actions: [],
        stats: [
            { label: 'Essais restants', id: 'attempts-remaining', value: '3' },
            { label: 'Score', id: 'score', value: '0' }
        ]
    });

    // Initialiser le compteur d'essais (récupère et affiche automatiquement)
    const remaining = await GameAttempts.initHeaderDisplay('nom-du-module', 3);

    if (remaining === 0) {
        Toast.warning('Plus d\'essais pour aujourd\'hui ! Reviens demain.');
        return;
    }

    // Lancer le jeu...
}

// Quand l'utilisateur termine une partie
async endGame(score, completed) {
    // Enregistrer la tentative
    await GameAttempts.recordAttempt('nom-du-module', {
        score: score,
        completed: completed
    });

    // Mettre à jour l'affichage
    const remaining = await GameAttempts.initHeaderDisplay('nom-du-module', 3);

    if (remaining === 0) {
        Toast.info('Plus d\'essais pour aujourd\'hui !');
    }
}
```

**Types de modules standards** :
- `word-search` - Mots mêlés
- `sudoku` - Sudoku
- `grid-navigation` - Déplacement sur grille
- `cipher` - Chiffrement
- `clock-reading` - Lecture d'heure
- `number-sequence` - Suites logiques

## CSS des toasts
Le toast doit être stylisé dans `shared/css/theme.css` ou dans le CSS du module :

```css
.toast {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 15px 30px;
    border-radius: 8px;
    opacity: 0;
    transition: opacity 0.3s;
    z-index: 9999;
    pointer-events: none;
}

.toast.show {
    opacity: 1;
}
```

## Layout et styles communs

Tous les modules utilisent les mêmes classes de layout définies dans `shared/css/theme.css` :

- **`.container`** : Conteneur principal (max-width: 1400px, centré, padding responsive)
- **`.main-content`** : Contenu principal du module (width: 100%)
- **`.game-area`** : Zone de jeu avec fond, bordures et padding (utilisé pour les zones de contenu)
- **`.game-actions`** : Container pour les boutons d'action (flex, gap, centré)
- **`.btn-primary`** : Bouton principal avec gradient bleu/violet
- **`.btn-secondary`** : Bouton secondaire avec bordure

**Exemple de structure HTML :**
```html
<div class="container">
    <!-- Header injecté par PageHeader -->

    <main class="main-content">
        <div class="game-area">
            <!-- Contenu du jeu -->
        </div>

        <div class="game-actions">
            <button class="btn-secondary">Action</button>
            <button class="btn-primary">Valider</button>
        </div>
    </main>

    <div id="toast" class="toast"></div>
</div>
```

## Bonnes pratiques

1. **Modularité** : Chaque module doit être autonome et ne pas dépendre des autres modules
2. **Animation de victoire** : TOUJOURS afficher `VictoryAnimation.show()` quand l'utilisateur gagne
3. **Pas de feedback div custom** : Toujours utiliser les toasts pour les notifications
4. **Header standardisé** : Toujours utiliser PageHeader.render()
5. **Navigation commune** : Ne pas créer de navigation custom
6. **Authentification** : Toujours vérifier l'authentification au chargement
7. **Crédits** : Utiliser la méthode `addCredits()` pour récompenser l'utilisateur
8. **Layout standardisé** : Utiliser les classes communes (.container, .game-area, .game-actions, etc.)
9. **Boutons standardisés** : Utiliser .btn-primary et .btn-secondary
10. **Responsive** : Le layout s'adapte automatiquement (mobile-first)
11. **Accessibilité** : Utiliser les attributs ARIA appropriés

