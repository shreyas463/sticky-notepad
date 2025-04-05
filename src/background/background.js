// Update background script to use StorageManager

// Import StorageManager
import { StorageManager } from './storage-manager.js';

// Create storage manager instance
const storageManager = new StorageManager();

// Initialize default settings when extension is installed
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Set default settings
    const defaultSettings = {
      visible: true,
      opacity: 0.9,
      fontSize: '14px',
      theme: 'light',
      storageType: 'local'
    };
    
    storageManager.save({ notepadSettings: defaultSettings })
      .then(() => {
        console.log('Default settings initialized');
      })
      .catch((error) => {
        console.error('Error initializing settings:', error);
      });
  }
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getSettings') {
    storageManager.get('notepadSettings')
      .then((result) => {
        sendResponse({ settings: result.notepadSettings });
      })
      .catch((error) => {
        console.error('Error getting settings:', error);
        sendResponse({ error: error.message });
      });
    return true; // Keep the message channel open for async response
  }
  
  if (message.action === 'changeStorageType') {
    storageManager.changeStorageType(message.storageType)
      .then(() => {
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error('Error changing storage type:', error);
        sendResponse({ error: error.message });
      });
    return true;
  }
  
  if (message.action === 'exportNotes') {
    storageManager.exportNotes(message.format)
      .then((filename) => {
        sendResponse({ success: true, filename: filename });
      })
      .catch((error) => {
        console.error('Error exporting notes:', error);
        sendResponse({ error: error.message });
      });
    return true;
  }
  
  if (message.action === 'importNotes') {
    storageManager.importNotes(message.content, message.format)
      .then((content) => {
        sendResponse({ success: true, content: content });
      })
      .catch((error) => {
        console.error('Error importing notes:', error);
        sendResponse({ error: error.message });
      });
    return true;
  }
});

// Handle tab updates to ensure notepad is injected on navigation
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url.startsWith('http')) {
    // Check if notepad should be visible
    storageManager.get('notepadSettings')
      .then((result) => {
        if (result.notepadSettings && result.notepadSettings.visible) {
          // Send message to content script to ensure notepad is initialized
          chrome.tabs.sendMessage(tabId, { 
            action: 'initializeNotepad'
          }).catch(() => {
            // Content script might not be loaded yet, which is fine
            console.log('Content script not ready yet');
          });
        }
      })
      .catch((error) => {
        console.error('Error checking notepad visibility:', error);
      });
  }
});
