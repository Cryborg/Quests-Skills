# Configuration Base de données

## Environnements

### Local (développement)
- **Type**: SQLite
- **Fichier**: `database/dev.db`
- **Variable**: `APP_ENV=local` (ou non défini)
- **Configuration**: Voir `server/turso-db.js` ligne 19-21

### Production (Vercel)
- **Type**: Turso (SQLite distribué)
- **URL**: Définie dans `TURSO_DATABASE_URL`
- **Auth Token**: Défini dans `TURSO_AUTH_TOKEN`
- **Variable**: `APP_ENV=production`
- **Configuration**: Voir `server/turso-db.js` ligne 28-30

## Commandes utiles

### SQLite local
```bash
# Voir les mots génériques (sans thème)
sqlite3 database/dev.db "SELECT * FROM word_search_words WHERE theme_slug IS NULL;"

# Voir tous les thèmes
sqlite3 database/dev.db "SELECT * FROM card_themes;"

# Voir toutes les cartes
sqlite3 database/dev.db "SELECT * FROM cards;"
```

### Turso production
```bash
# Se connecter à la base
turso db shell quests-and-skills

# Requêtes depuis le shell
turso db shell quests-and-skills "SELECT * FROM word_search_words LIMIT 5;"
```

## Notes importantes
- **TOUJOURS** utiliser SQLite local en dev (APP_ENV != production)
- **JAMAIS** modifier directement Turso en prod, utiliser les migrations
- Les deux bases doivent avoir le même schéma
