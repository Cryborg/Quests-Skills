# 🚀 Déploiement sur Vercel + Turso

## ⚠️ IMPORTANT - Variables d'environnement Vercel

Avant de pusher, configure ces variables sur Vercel :

1. Va sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionne ton projet
3. Va dans **Settings** → **Environment Variables**
4. Ajoute :

```
TURSO_DATABASE_URL=libsql://questsskills-cryborg.aws-eu-west-1.turso.io
TURSO_AUTH_TOKEN=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NTk4MzY1NjAsImlkIjoiNzQ3MWNlNmItMzYzYS00MTk1LThkMWMtZjYxZTJmMjBmZWRjIiwicmlkIjoiYWI4MmVhODMtZmNiMy00ZjQ2LTgzNjEtMjE5YjgyMTExNGI4In0.9fO2HS9uOmxWoNmVYN5NqL1H6kEz6pc64FGpfe1t8_iVNhc2WHVudGaG7pol4hcJJncdqo3bDJwHIzprBp1eAg
```

Applique pour : Production, Preview, Development

## Étapes

### 1. Push
```bash
git add .
git commit -m "Refactor: migrate from Prisma to direct libsql"
git push
```

### 2. La base Turso est déjà initialisée ✅
Les migrations et le seed ont déjà été appliqués !

### 3. Teste
- https://ton-projet.vercel.app/api/cards
- https://ton-projet.vercel.app/api/auth/me
