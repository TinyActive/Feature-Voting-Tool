#!/bin/bash
set -e

echo "🔧 Updating wrangler.toml with environment variables..."

# Check if required env vars are set
if [ -z "$CF_D1_DATABASE_ID" ]; then
  echo "❌ Error: CF_D1_DATABASE_ID is not set"
  exit 1
fi

if [ -z "$CF_KV_NAMESPACE_ID" ]; then
  echo "❌ Error: CF_KV_NAMESPACE_ID is not set"
  exit 1
fi

# Create a temporary wrangler.toml with actual values
sed "s/\${CF_D1_DATABASE_ID}/$CF_D1_DATABASE_ID/g; s/\${CF_KV_NAMESPACE_ID}/$CF_KV_NAMESPACE_ID/g" wrangler.toml > wrangler.toml.tmp

# Replace original file
mv wrangler.toml.tmp wrangler.toml

echo "✅ Updated wrangler.toml:"
echo "   D1 Database ID: $CF_D1_DATABASE_ID"
echo "   KV Namespace ID: $CF_KV_NAMESPACE_ID"
