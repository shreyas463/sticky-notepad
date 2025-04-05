# Chrome Extension Manifest V3 Structure

## Basic Structure
The manifest.json file is the heart of a Chrome extension. It tells Chrome about the extension's capabilities and configuration.

```json
{
  "manifest_version": 3,
  "name": "Sticky Notepad",
  "version": "1.0",
  "description": "A sticky notepad that stays on screen while browsing",
  "permissions": ["storage"],
  "action": {
    "default_popup": "popup/popup.html",
    "default_icon": "icons/icon.png"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content_scripts/content.js"],
      "css": ["content_scripts/content.css"]
    }
  ],
  "background": {
    "service_worker": "background.js"
  }
}
```

## Key Components

### manifest_version
Specifies we're using Manifest V3, the latest version for Chrome extensions.

### permissions
- `storage`: Required for saving notes locally or syncing to cloud
- We don't need `activeTab` since our notepad will be persistent across all pages

### action
Defines the browser toolbar icon and popup behavior.

### content_scripts
Content scripts run in the context of web pages. This is where we'll implement the sticky notepad UI that persists across page navigation.

### background
The background service worker handles events and manages state even when the popup is closed.

## Storage Options

### chrome.storage.local
- Local storage that persists until the extension is removed
- Storage limit is 10 MB (5 MB in Chrome 113 and earlier)
- Good for storing larger amounts of data

### chrome.storage.sync
- Syncs data across Chrome browsers where the user is logged in
- Limited to approximately 100 KB total, 8 KB per item
- Good for user preferences and smaller notes

### Google Drive API Integration
- Requires OAuth 2.0 authentication
- Allows for unlimited storage in the user's Google Drive
- More complex to implement but provides cloud backup
