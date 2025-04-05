// Background script for Sticky Notepad extension

// Storage Manager implementation directly in the background script
class StorageManager {
  constructor() {
    this.currentStorageType = 'local'; // Default storage type
  }

  // Get data from storage
  get(keys) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(keys, (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result);
        }
      });
    });
  }

  // Save data to storage
  save(data) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set(data, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }
}

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
    // We're only using local storage now, so just acknowledge the request
    sendResponse({ success: true });
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
