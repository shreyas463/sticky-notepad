#!/bin/bash

# Script to package the Sticky Notepad extension for distribution

echo "Packaging Sticky Notepad extension..."

# Set directories
SRC_DIR="$(pwd)/src"
DIST_DIR="$(pwd)/dist"
PACKAGE_NAME="sticky-notepad-extension"

# Create clean dist directory
rm -rf "$DIST_DIR/$PACKAGE_NAME"
mkdir -p "$DIST_DIR/$PACKAGE_NAME"

# Copy all necessary files
echo "Copying files..."
cp -r "$SRC_DIR/manifest.json" "$DIST_DIR/$PACKAGE_NAME/"
cp -r "$SRC_DIR/popup" "$DIST_DIR/$PACKAGE_NAME/"
cp -r "$SRC_DIR/content_scripts" "$DIST_DIR/$PACKAGE_NAME/"
cp -r "$SRC_DIR/background" "$DIST_DIR/$PACKAGE_NAME/"
cp -r "$SRC_DIR/icons" "$DIST_DIR/$PACKAGE_NAME/"

# Create zip file for Chrome Web Store
echo "Creating zip file..."
cd "$DIST_DIR"
zip -r "$PACKAGE_NAME.zip" "$PACKAGE_NAME"

echo "Package created at $DIST_DIR/$PACKAGE_NAME.zip"
echo "Ready for submission to Chrome Web Store!"
