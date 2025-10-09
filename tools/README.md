# 🛠️ Scripts utilitaires

Ce dossier contient des scripts de maintenance et d'administration pour le projet.

## 📝 Scripts disponibles

### `reseed-words-production.js`

**Usage :** Reseeder uniquement les mots de la base de données en production.

```bash
APP_ENV=production node tools/reseed-words-production.js
```

**Description :**
- Connecte à la base Turso en production
- Insère les 200+ mots génériques pour les mots mêlés
- Vérifie les doublons avant insertion (pas de duplication)
- Ne touche à AUCUNE autre donnée

**Quand l'utiliser :**
- Après une perte accidentelle de données
- Pour ajouter de nouveaux mots à la liste existante
- Pour s'assurer que tous les mots sont présents

## ⚠️ Sécurité

**IMPORTANT :** Ces scripts sont réservés à l'administration. Ne jamais les exécuter sans :
1. Comprendre ce qu'ils font
2. Avoir une sauvegarde récente
3. Vérifier qu'on est sur le bon environnement

## 🔒 Protection en production

Le système de seeding est protégé en production :
- Par défaut, **AUCUN seed automatique** en production
- Nécessite `ALLOW_SEED=true` dans les variables d'environnement Vercel
- Empêche les réinitialisations accidentelles lors des déploiements

Pour activer temporairement le seeding en production :
1. Aller dans Vercel → Settings → Environment Variables
2. Ajouter `ALLOW_SEED=true`
3. Redéployer
4. **IMPORTANT :** Retirer la variable immédiatement après
