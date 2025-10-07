#!/bin/bash

echo "🧪 Test de l'API Cards Collection v2"
echo "======================================"
echo ""

# Test health
echo "1. Health check..."
curl -s http://localhost:3000/api/health | jq '.'
echo ""

# Test cards
echo "2. Liste des cartes (5 premières)..."
curl -s http://localhost:3000/api/cards | jq '.[0:5]'
echo ""

# Test user courant
echo "3. User courant..."
curl -s http://localhost:3000/api/auth/me | jq '.'
echo ""

# Test bonus operations
echo "4. Opérations bonus..."
curl -s http://localhost:3000/api/bonus-operations | jq '.'
echo ""

# Test user cards
echo "5. Cartes de l'user..."
curl -s http://localhost:3000/api/users/1/cards | jq '.'
echo ""

# Test crédits
echo "6. Crédits de l'user..."
curl -s http://localhost:3000/api/users/1/credits | jq '.'
echo ""

echo "✅ Tests terminés !"
