#!/bin/bash

# 1. Get Git Hash
# If not a git repo or fails, fallback to 'dev'
if git rev-parse --git-dir > /dev/null 2>&1; then
    GIT_HASH=$(git rev-parse --short HEAD)
else
    GIT_HASH="dev"
fi

VERSION_STRING="Build $GIT_HASH"

echo "Current Version: $VERSION_STRING (Hash: $GIT_HASH)"

# 2. Update JS
# Create js directory if it doesn't exist (though it should)
mkdir -p js
echo "export const APP_VERSION = '$VERSION_STRING';" > js/version.js
echo "Updated js/version.js"

# 3. Update HTML Files
# Look for all html files in the current directory
for file in *.html; do
    # Check if file exists
    [ -e "$file" ] || continue

    # Using sed with -i '' for macOS compatibility (in-place edit)
    # Using -E for extended regex (support for +)
    
    # A. Update Footer Version Text: <span class="version">Build XXXXXX</span>
    sed -i '' -E "s|<span class=\"version\">Build [a-f0-9]+</span>|<span class=\"version\">$VERSION_STRING</span>|g" "$file"

    # B. Update Cache Busting: ?v=XXXXXX"
    # Matches ?v=... followed by a double quote
    sed -i '' -E "s|\?v=[a-f0-9]+\"|?v=$GIT_HASH\"|g" "$file"
    
    echo "Updated $file"
done

echo "🎉 Version update complete!"
