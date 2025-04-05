// Enhanced storage implementation for Sticky Notepad extension

// Storage Manager class to handle different storage types
class StorageManager {
  constructor() {
    this.currentStorageType = 'local'; // Default storage type
    this.driveAPIReady = false;
    this.initializeStorageType();
  }

  // Initialize storage type from settings
  async initializeStorageType() {
    try {
      const result = await this.getFromStorage('local', 'notepadSettings');
      if (result.notepadSettings && result.notepadSettings.storageType) {
        this.currentStorageType = result.notepadSettings.storageType;
      }
    } catch (error) {
      console.error('Error initializing storage type:', error);
    }
  }

  // Get data from specified storage
  getFromStorage(storageType, keys) {
    return new Promise((resolve, reject) => {
      if (storageType === 'drive') {
        this.getFromDrive(keys)
          .then(resolve)
          .catch(reject);
      } else {
        chrome.storage[storageType].get(keys, (result) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(result);
          }
        });
      }
    });
  }

  // Save data to specified storage
  saveToStorage(storageType, data) {
    return new Promise((resolve, reject) => {
      if (storageType === 'drive') {
        this.saveToDrive(data)
          .then(resolve)
          .catch(reject);
      } else {
        chrome.storage[storageType].set(data, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      }
    });
  }

  // Get data from current storage type
  async get(keys) {
    try {
      return await this.getFromStorage(this.currentStorageType, keys);
    } catch (error) {
      console.error('Error getting data, falling back to local storage:', error);
      return await this.getFromStorage('local', keys);
    }
  }

  // Save data to current storage type
  async save(data) {
    try {
      await this.saveToStorage(this.currentStorageType, data);
      
      // If using sync or drive, also save to local as backup
      if (this.currentStorageType !== 'local') {
        await this.saveToStorage('local', data);
      }
    } catch (error) {
      console.error('Error saving data, falling back to local storage:', error);
      await this.saveToStorage('local', data);
    }
  }

  // Change storage type
  async changeStorageType(newType) {
    if (newType === 'drive' && !this.driveAPIReady) {
      await this.initializeDriveAPI();
    }
    
    this.currentStorageType = newType;
    
    // Update settings
    try {
      const result = await this.getFromStorage('local', 'notepadSettings');
      const settings = result.notepadSettings || {};
      settings.storageType = newType;
      await this.saveToStorage('local', { notepadSettings: settings });
    } catch (error) {
      console.error('Error updating storage type in settings:', error);
    }
  }

  // Initialize Google Drive API
  async initializeDriveAPI() {
    // This is a placeholder for Google Drive API initialization
    // In a real implementation, this would authenticate with Google and set up the API
    console.log('Initializing Google Drive API...');
    
    // Simulate API initialization
    return new Promise((resolve) => {
      setTimeout(() => {
        this.driveAPIReady = true;
        console.log('Google Drive API initialized');
        resolve();
      }, 1000);
    });
  }

  // Get data from Google Drive
  async getFromDrive(keys) {
    // This is a placeholder for Google Drive API implementation
    console.log('Getting data from Google Drive:', keys);
    
    // In a real implementation, this would fetch data from Google Drive
    // For now, fall back to local storage
    return await this.getFromStorage('local', keys);
  }

  // Save data to Google Drive
  async saveToDrive(data) {
    // This is a placeholder for Google Drive API implementation
    console.log('Saving data to Google Drive:', data);
    
    // In a real implementation, this would save data to Google Drive
    // For now, save to local storage as a fallback
    return await this.saveToStorage('local', data);
  }

  // Export notes to a file
  exportNotes(format = 'txt') {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.get('noteContent');
        const content = result.noteContent || '';
        
        let blob;
        let filename;
        
        if (format === 'txt') {
          blob = new Blob([content], { type: 'text/plain' });
          filename = 'sticky_notes.txt';
        } else if (format === 'json') {
          const data = {
            content: content,
            timestamp: new Date().toISOString(),
            version: '1.0'
          };
          blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          filename = 'sticky_notes.json';
        } else {
          reject(new Error('Unsupported format'));
          return;
        }
        
        // Create download link
        const url = URL.createObjectURL(blob);
        
        // Create temporary link and trigger download
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          resolve(filename);
        }, 100);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Import notes from a file
  importNotes(fileContent, format = 'txt') {
    return new Promise(async (resolve, reject) => {
      try {
        let content;
        
        if (format === 'txt') {
          content = fileContent;
        } else if (format === 'json') {
          try {
            const data = JSON.parse(fileContent);
            content = data.content || '';
          } catch (e) {
            reject(new Error('Invalid JSON file'));
            return;
          }
        } else {
          reject(new Error('Unsupported format'));
          return;
        }
        
        // Save imported content
        await this.save({ noteContent: content });
        resolve(content);
      } catch (error) {
        reject(error);
      }
    });
  }
}

// Export the StorageManager class
window.StorageManager = StorageManager;
