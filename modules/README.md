# Modules

Cette application est organisée en modules indépendants.

## Structure

```
modules/
├── cards/              # Module de collection de cartes
│   ├── index.html
│   ├── styles.css
│   └── js/
│
└── math-exercises/     # Module d'exercices mathématiques
    ├── bonus.html
    ├── historique.html
    ├── bonus.css
    ├── historique.css
    ├── bonus.js
    └── historique.js
```

## Indépendance des modules

Chaque module est **totalement indépendant** :

- ✅ Tous les fichiers d'un module sont dans son dossier
- ✅ Les modules ne s'importent pas directement entre eux
- ✅ La communication se fait via widgets optionnels (dans `/shared/js/`)
- ✅ Tu peux supprimer/désactiver un module sans casser les autres

## Activer/Désactiver un module

### Désactiver le module math-exercises

1. Retirer le bouton bonus du HTML :
   ```html
   <!-- Dans modules/cards/index.html, commenter ou supprimer : -->
   <button id="bonus-btn" class="bonus-btn" data-module="math-exercises">
   ```

2. Retirer le widget :
   ```html
   <!-- Dans modules/cards/index.html, commenter : -->
   <!-- <script src="../../shared/js/math-exercises-widget.js"></script> -->
   ```

3. (Optionnel) Supprimer le dossier `modules/math-exercises/`

### Ajouter un nouveau module

1. Créer un dossier `modules/mon-module/`
2. Mettre tous les fichiers du module dedans
3. Si besoin d'un widget pour s'intégrer à d'autres modules : créer `shared/js/mon-module-widget.js`
4. Documenter ici !

## Ressources partagées

Le dossier `/shared/` contient :
- `js/config.js` : Configuration et utilitaires communs
- `images/` : Images utilisées par les modules
- `css/` : (optionnel) Styles communs
- `js/*-widget.js` : Widgets pour intégration inter-modules
