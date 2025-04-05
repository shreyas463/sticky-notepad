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
  try {
    if (details && details.reason === 'install') {
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
  } catch (error) {
    console.error('Error in onInstalled listener:', error);
  }
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  try {
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
      // Since we don't have exportNotes method, respond with an error
      console.error('Export notes functionality not implemented');
      sendResponse({ success: false, error: 'Export functionality not implemented' });
      return true;
    }
    
    if (message.action === 'importNotes') {
      // Since we don't have importNotes method, respond with an error
      console.error('Import notes functionality not implemented');
      sendResponse({ success: false, error: 'Import functionality not implemented' });
      return true;
    }
    
    // Default response for unknown actions
    sendResponse({ success: false, error: 'Unknown action' });
    return true;
  } catch (error) {
    console.error('Error in message handler:', error);
    sendResponse({ success: false, error: error.message });
    return true;
  }
});

// Handle tab updates to ensure notepad is injected on navigation
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  try {
    // Check if tab and tab.url exist and if the URL starts with http or https
    if (changeInfo.status === 'complete' && tab && tab.url && (tab.url.startsWith('http') || tab.url.startsWith('https'))) {
      // Check if notepad should be visible
      storageManager.get('notepadSettings')
        .then((result) => {
          if (result.notepadSettings && result.notepadSettings.visible) {
            // Send message to content script to ensure notepad is initialized
            chrome.tabs.sendMessage(tabId, { 
              action: 'initializeNotepad'
            }).catch(() => {
              // Content script might not be loaded yet, which is fine
            });
          }
        })
        .catch((error) => {
          console.error('Error getting notepad settings:', error);
        });
    }
  } catch (error) {
    console.error('Error in tab update handler:', error);
  }
});
