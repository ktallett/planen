#!/bin/bash
# Update version script for Planen
# Usage: ./update-version.sh 0.2.0

set -e

if [ -z "$1" ]; then
    echo "Error: Version number required"
    echo "Usage: ./update-version.sh 0.2.0"
    exit 1
fi

NEW_VERSION="$1"
RELEASE_DATE=$(date +%Y-%m-%d)

echo "Updating Planen to version $NEW_VERSION..."

# Update version.json
echo "{
  \"version\": \"$NEW_VERSION\",
  \"releaseDate\": \"$RELEASE_DATE\"
}" > version.json

# Copy to public directory
cp version.json public/version.json

# Update package.json
sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$NEW_VERSION\"/" package.json

# Update src/hooks/useUpdateChecker.js
sed -i "s/const CURRENT_VERSION = '[^']*'/const CURRENT_VERSION = '$NEW_VERSION'/" src/hooks/useUpdateChecker.js

# Update src-tauri/tauri.conf.json
sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$NEW_VERSION\"/" src-tauri/tauri.conf.json

# Update src-tauri/Cargo.toml
sed -i "s/^version = \"[^\"]*\"/version = \"$NEW_VERSION\"/" src-tauri/Cargo.toml

echo "✓ Updated version.json"
echo "✓ Updated public/version.json"
echo "✓ Updated package.json"
echo "✓ Updated src/hooks/useUpdateChecker.js"
echo "✓ Updated src-tauri/tauri.conf.json"
echo "✓ Updated src-tauri/Cargo.toml"
echo ""
echo "Version updated to $NEW_VERSION successfully!"
echo ""
echo "Next steps:"
echo "  1. Review the changes: git diff"
echo "  2. Build the project: npm run build"
echo "  3. Test the build"
echo "  4. Commit the changes: git add . && git commit -m 'Bump version to $NEW_VERSION'"
echo "  5. Deploy web app: npm run deploy"
echo "  6. Build desktop app: npm run tauri:build"
