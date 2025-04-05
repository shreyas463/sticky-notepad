# Sticky Notepad Browser Extension - Code Structure Documentation

## Project Overview

The Sticky Notepad browser extension is built using standard web technologies (HTML, CSS, JavaScript) following the Chrome Extension Manifest V3 architecture. The extension consists of several components that work together to provide a seamless note-taking experience while browsing the web.

## Directory Structure

```
sticky-notepad-extension/
├── manifest.json           # Extension configuration
├── popup/                  # Popup UI files
│   ├── popup.html          # Popup HTML structure
│   ├── popup.css           # Popup styling
│   └── popup.js            # Popup functionality
├── content_scripts/        # Content scripts injected into web pages
│   ├── content.js          # Notepad functionality
│   └── content.css         # Notepad styling
├── background/             # Background service worker
│   ├── background.js       # Background script
│   └── storage-manager.js  # Storage handling
└── icons/                  # Extension icons
    ├── icon16.svg          # 16x16 icon
    ├── icon48.svg          # 48x48 icon
    ├── icon128.svg         # 128x128 icon
    └── create_icons.js     # Icon generation script
```

## Component Details

### 1. Manifest (manifest.json)

The manifest.json file is the configuration file for the extension. It defines:
- Basic metadata (name, version, description)
- Permissions required by the extension
- Extension components (popup, content scripts, background script)
- Icon definitions

### 2. Popup UI (popup/)

The popup UI is displayed when the user clicks the extension icon in the browser toolbar.

**popup.html**
- Defines the structure of the settings popup
- Contains controls for notepad visibility, appearance, and storage options
- Includes import/export functionality

**popup.css**
- Styles the popup interface
- Implements responsive design for the settings controls
- Defines animations and interactive elements

**popup.js**
- Handles user interactions with the popup
- Communicates with the background script to update settings
- Manages storage preference changes
- Implements import/export functionality

### 3. Content Scripts (content_scripts/)

Content scripts are injected into web pages to create and manage the notepad interface.

**content.js**
- Creates the notepad UI dynamically
- Implements dragging and resizing functionality
- Handles text input and auto-saving
- Manages notepad visibility and position
- Communicates with background script for storage operations
- Implements theme switching and appearance customization

**content.css**
- Defines the visual appearance of the notepad
- Implements themes (light, dark, yellow)
- Handles responsive design and animations
- Ensures the notepad doesn't interfere with website styling

### 4. Background Script (background/)

The background script runs in the extension's background context and manages global state.

**background.js**
- Initializes default settings on installation
- Handles communication between popup and content scripts
- Manages extension lifecycle events
- Ensures notepad is properly initialized when navigating to new pages

**storage-manager.js**
- Implements a comprehensive storage system
- Handles different storage types (local, sync, Google Drive)
- Provides fallback mechanisms for storage failures
- Implements import/export functionality
- Manages data persistence across browser sessions

### 5. Icons (icons/)

The icons directory contains the extension icons in various sizes.

**create_icons.js**
- Script to generate SVG icons in different sizes
- Creates consistent branding across all icon sizes

## Communication Flow

1. **User Interaction with Popup**:
   - User changes settings in the popup
   - popup.js sends messages to background.js
   - background.js updates storage and notifies content.js

2. **Notepad Interaction**:
   - User interacts with the notepad on a web page
   - content.js handles the interaction
   - content.js communicates with background.js for storage operations

3. **Storage Operations**:
   - storage-manager.js handles all storage operations
   - Provides a consistent API for different storage types
   - Implements fallback mechanisms for reliability

## Key Implementation Details

### Notepad Persistence
- The notepad position, size, and content are saved to browser storage
- When navigating to a new page, the content script recreates the notepad with the saved state
- The background script ensures the notepad is initialized on each page load

### Draggable and Resizable UI
- Implemented using mouse event listeners (mousedown, mousemove, mouseup)
- Position constraints ensure the notepad stays within the viewport
- Resize functionality maintains minimum dimensions for usability

### Storage System
- Uses Chrome's storage API (chrome.storage.local and chrome.storage.sync)
- Implements a fallback system to ensure data is never lost
- Provides placeholder implementation for Google Drive integration

### Theme Implementation
- CSS classes control the visual appearance of the notepad
- Themes are applied dynamically based on user preferences
- All themes maintain readability and usability

## Extension Permissions

The extension requires minimal permissions:
- `storage`: To save notes and settings
- Content script access: To inject the notepad into web pages

## Future Development Considerations

1. **Google Drive Integration**:
   - The current implementation includes placeholders for Google Drive integration
   - Full implementation would require OAuth authentication and API integration

2. **Additional Features**:
   - Rich text formatting
   - Multiple notepads
   - Note organization and categorization
   - Sharing capabilities

3. **Performance Optimizations**:
   - Further debouncing of storage operations
   - Lazy loading of resources
   - More efficient DOM operations
