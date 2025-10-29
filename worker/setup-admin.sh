#!/bin/bash

# Setup Admin Script
# This script helps you set up the first admin user for the RBAC system

echo "==================================="
echo "Feature Voting Tool - Admin Setup"
echo "==================================="
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "Error: wrangler CLI is not installed"
    echo "Please install it with: npm install -g wrangler"
    exit 1
fi

# Get admin email
read -p "Enter admin email address: " ADMIN_EMAIL

if [ -z "$ADMIN_EMAIL" ]; then
    echo "Error: Email cannot be empty"
    exit 1
fi

# Validate email format (basic)
if ! echo "$ADMIN_EMAIL" | grep -E "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$" > /dev/null; then
    echo "Error: Invalid email format"
    exit 1
fi

echo ""
echo "Step 1: Running RBAC migration..."
wrangler d1 execute DB --file=src/db/migration-rbac.sql

if [ $? -ne 0 ]; then
    echo "Warning: Migration may have already been applied or failed"
    echo "Continuing with admin email setup..."
fi

echo ""
echo "Step 2: Adding admin email to whitelist..."

# Create SQL to add admin email
SQL="INSERT OR IGNORE INTO admin_emails (email, added_at, added_by) 
VALUES ('$ADMIN_EMAIL', $(date +%s)000, 'system');"

echo "$SQL" | wrangler d1 execute DB --command="$SQL"

if [ $? -eq 0 ]; then
    echo "✓ Admin email added successfully"
else
    echo "✗ Failed to add admin email"
    exit 1
fi

echo ""
echo "Step 3: Checking if user exists..."

# Check if user already exists
USER_CHECK=$(wrangler d1 execute DB --command="SELECT id, role FROM users WHERE email = '$ADMIN_EMAIL';" --json)

if echo "$USER_CHECK" | grep -q "\"id\""; then
    echo "✓ User exists, updating role to admin..."
    wrangler d1 execute DB --command="UPDATE users SET role = 'admin', status = 'active' WHERE email = '$ADMIN_EMAIL';"
    
    if [ $? -eq 0 ]; then
        echo "✓ User role updated to admin"
    else
        echo "✗ Failed to update user role"
        exit 1
    fi
else
    echo "ℹ User does not exist yet. They will be created as admin on first login."
fi

echo ""
echo "==================================="
echo "✓ Admin setup complete!"
echo "==================================="
echo ""
echo "Next steps:"
echo "1. Deploy your worker: npm run deploy"
echo "2. Go to your app and login with: $ADMIN_EMAIL"
echo "3. Check your email for the magic link"
echo "4. You will have admin access after login"
echo ""
echo "Admin email whitelist:"
wrangler d1 execute DB --command="SELECT email, datetime(added_at/1000, 'unixepoch') as added_date FROM admin_emails ORDER BY added_at DESC;"
echo ""
