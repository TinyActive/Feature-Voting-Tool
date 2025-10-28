#!/bin/bash
set -e

echo "🚀 Setting up Cloudflare resources..."

# ============================================
# D1 Database Setup
# ============================================
echo "📦 Setting up D1 database..."

# Try to create database
D1_OUTPUT=$(npx wrangler d1 create feature-voting-db 2>&1 || true)
echo "D1 Output: $D1_OUTPUT"

if echo "$D1_OUTPUT" | grep -q "database_id"; then
  # New database created
  DATABASE_ID=$(echo "$D1_OUTPUT" | grep "database_id" | sed 's/.*database_id = "\([^"]*\)".*/\1/')
  echo "✅ Created new D1 Database ID: $DATABASE_ID"
  sed -i.bak "s/database_id = \"placeholder\"/database_id = \"$DATABASE_ID\"/" wrangler.toml
elif echo "$D1_OUTPUT" | grep -q "already exists"; then
  # Database exists, fetch ID from list
  echo "ℹ️  D1 database already exists, fetching ID..."
  D1_LIST=$(npx wrangler d1 list 2>&1)
  echo "D1 List: $D1_LIST"
  DATABASE_ID=$(echo "$D1_LIST" | grep "feature-voting-db" | awk '{print $2}')
  
  if [ -n "$DATABASE_ID" ]; then
    echo "✅ Found existing D1 Database ID: $DATABASE_ID"
    sed -i.bak "s/database_id = \"placeholder\"/database_id = \"$DATABASE_ID\"/" wrangler.toml
  else
    echo "⚠️  Could not find D1 database ID, keeping placeholder"
  fi
else
  echo "⚠️  Unexpected D1 output, keeping placeholder"
fi

# ============================================
# KV Namespace Setup
# ============================================
echo "📦 Setting up KV namespace..."

# Try to create KV namespace
KV_OUTPUT=$(npx wrangler kv:namespace create "RATE_LIMIT_KV" 2>&1 || true)
echo "KV Output: $KV_OUTPUT"

if echo "$KV_OUTPUT" | grep -q "id ="; then
  # New namespace created
  KV_ID=$(echo "$KV_OUTPUT" | grep "id =" | sed 's/.*id = "\([^"]*\)".*/\1/')
  echo "✅ Created new KV Namespace ID: $KV_ID"
  sed -i.bak "s/id = \"placeholder\"/id = \"$KV_ID\"/" wrangler.toml
elif echo "$KV_OUTPUT" | grep -q "already exists\|A namespace with this title already exists"; then
  # Namespace exists, fetch ID from list
  echo "ℹ️  KV namespace already exists, fetching ID..."
  KV_LIST=$(npx wrangler kv:namespace list 2>&1)
  echo "KV List: $KV_LIST"
  KV_ID=$(echo "$KV_LIST" | grep "RATE_LIMIT_KV" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
  
  if [ -n "$KV_ID" ]; then
    echo "✅ Found existing KV Namespace ID: $KV_ID"
    sed -i.bak "s/id = \"placeholder\"/id = \"$KV_ID\"/" wrangler.toml
  else
    echo "⚠️  Could not find KV namespace ID, keeping placeholder"
  fi
else
  echo "⚠️  Unexpected KV output, keeping placeholder"
fi

echo ""
echo "✅ Resources setup complete!"
echo "📄 Updated wrangler.toml with resource IDs"
echo ""
echo "📋 Current wrangler.toml content:"
cat wrangler.toml
