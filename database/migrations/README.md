# Database Migrations

## Comment ça marche ?

Les migrations se lancent **automatiquement** au premier appel API après un déploiement.

- ✅ **100% automatique** en production (Vercel)
- ✅ Exécute seulement les migrations **pas encore appliquées**
- ✅ **Zéro overhead** après la première exécution
- ✅ **Thread-safe** : même si plusieurs requêtes arrivent en même temps

## Créer une nouvelle migration

1. Créer un fichier dans `database/migrations/` avec le format :
   ```
   XXX_nom_de_la_migration.js
   ```
   Le numéro XXX doit être **incrémental** (001, 002, 003, etc.)

2. Template de migration :
   ```javascript
   const { query } = require('../../server/turso-db');

   async function up() {
       console.log('Running migration: XXX_nom_migration');

       // Vos changements de schéma ici
       await query(`CREATE TABLE ...`);

       console.log('✅ Migration completed');
   }

   async function down() {
       console.log('Rolling back migration: XXX_nom_migration');

       // Rollback (optionnel, pour le dev)
       await query(`DROP TABLE ...`);

       console.log('✅ Rollback completed');
   }

   module.exports = { up, down };
   ```

3. Push et c'est tout ! Vercel va déployer et la migration se fera automatiquement.

## Tester en local

```bash
npm run migrate
```

## Comment ça marche techniquement ?

1. Table `migrations` créée automatiquement pour tracker les migrations exécutées
2. À chaque démarrage, le middleware `ensureMigrations` :
   - Vérifie quelles migrations ont déjà tourné
   - Exécute les nouvelles dans l'ordre
   - Enregistre leur exécution
   - Met un flag pour ne plus jamais réessayer
3. Les requêtes suivantes passent directement (if check ultra-rapide)

## Notes importantes

- ✅ Les migrations sont **idempotentes** (utilise `IF NOT EXISTS`)
- ✅ Safe pour la production
- ✅ Pas besoin d'action manuelle
- ⚠️ Ne jamais modifier une migration déjà déployée
- ⚠️ Toujours créer une NOUVELLE migration pour un changement
