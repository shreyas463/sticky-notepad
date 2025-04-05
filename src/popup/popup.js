// Update popup script to use the enhanced storage options

// DOM elements
const notepadToggle = document.getElementById('notepad-toggle');
const opacitySlider = document.getElementById('opacity');
const fontSizeSelect = document.getElementById('font-size');
const themeSelect = document.getElementById('theme');
const storageOptions = document.querySelectorAll('input[name="storage"]');
const saveButton = document.getElementById('save-settings');
const resetButton = document.getElementById('reset-settings');
const exportButton = document.createElement('button');
const importButton = document.createElement('button');
const fileInput = document.createElement('input');

// Default settings
const defaultSettings = {
  visible: true,
  opacity: 0.9,
  fontSize: '14px',
  theme: 'light',
  storageType: 'local'
};

// Load settings when popup opens
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  
  // Add event listeners
  saveButton.addEventListener('click', saveSettings);
  resetButton.addEventListener('click', resetSettings);
  notepadToggle.addEventListener('change', toggleNotepadVisibility);
  
  // Add export/import buttons
  setupExportImport();
  
  // Add storage type change listeners
  for (const option of storageOptions) {
    option.addEventListener('change', handleStorageTypeChange);
  }
});

// Load settings from storage
function loadSettings() {
  chrome.storage.local.get('notepadSettings', (result) => {
    const settings = result.notepadSettings || defaultSettings;
    
    // Apply settings to UI
    notepadToggle.checked = settings.visible;
    opacitySlider.value = settings.opacity;
    fontSizeSelect.value = settings.fontSize;
    themeSelect.value = settings.theme;
    
    // Set storage option
    for (const option of storageOptions) {
      if (option.value === settings.storageType) {
        option.checked = true;
      }
    }
    
    // Enable/disable Google Drive option based on availability
    const driveOption = document.getElementById('drive-storage');
    if (driveOption) {
      // In a future version, we would check if Drive API is available
      // For now, keep it disabled with "Coming Soon" label
    }
  });
}

// Save settings
function saveSettings() {
  // Get selected storage type
  let selectedStorage = 'local';
  for (const option of storageOptions) {
    if (option.checked) {
      selectedStorage = option.value;
    }
  }
  
  // Create settings object
  const settings = {
    visible: notepadToggle.checked,
    opacity: parseFloat(opacitySlider.value),
    fontSize: fontSizeSelect.value,
    theme: themeSelect.value,
    storageType: selectedStorage
  };
  
  // Save to storage
  chrome.storage.local.set({ notepadSettings: settings }, () => {
    // Notify content script about settings change
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { 
        action: 'updateSettings',
        settings: settings
      });
    });
    
    // Show save confirmation
    saveButton.textContent = 'Saved!';
    setTimeout(() => {
      saveButton.textContent = 'Save Settings';
    }, 1500);
  });
}

// Reset settings to default
function resetSettings() {
  // Apply default settings to UI
  notepadToggle.checked = defaultSettings.visible;
  opacitySlider.value = defaultSettings.opacity;
  fontSizeSelect.value = defaultSettings.fontSize;
  themeSelect.value = defaultSettings.theme;
  
  // Set default storage option
  for (const option of storageOptions) {
    if (option.value === defaultSettings.storageType) {
      option.checked = true;
    }
  }
  
  // Save default settings
  saveSettings();
}

// Toggle notepad visibility
function toggleNotepadVisibility() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { 
      action: 'toggleVisibility',
      visible: notepadToggle.checked
    });
  });
}

// Handle storage type change
function handleStorageTypeChange(event) {
  const newStorageType = event.target.value;
  
  // Notify background script to change storage type
  chrome.runtime.sendMessage({
    action: 'changeStorageType',
    storageType: newStorageType
  }, (response) => {
    if (response && response.error) {
      console.error('Error changing storage type:', response.error);
      // Revert UI if there was an error
      loadSettings();
    }
  });
}

// Setup export and import functionality
function setupExportImport() {
  // Create export button
  exportButton.id = 'export-notes';
  exportButton.textContent = 'Export Notes';
  exportButton.className = 'secondary-button';
  exportButton.addEventListener('click', exportNotes);
  
  // Create import button
  importButton.id = 'import-notes';
  importButton.textContent = 'Import Notes';
  importButton.className = 'secondary-button';
  importButton.addEventListener('click', () => fileInput.click());
  
  // Create file input for import
  fileInput.type = 'file';
  fileInput.accept = '.txt,.json';
  fileInput.style.display = 'none';
  fileInput.addEventListener('change', importNotes);
  
  // Create export/import section
  const exportImportSection = document.createElement('div');
  exportImportSection.className = 'export-import-section';
  
  const exportImportTitle = document.createElement('h2');
  exportImportTitle.textContent = 'Export/Import';
  
  exportImportSection.appendChild(exportImportTitle);
  exportImportSection.appendChild(exportButton);
  exportImportSection.appendChild(importButton);
  exportImportSection.appendChild(fileInput);
  
  // Add to popup
  const buttonsSection = document.querySelector('.buttons');
  buttonsSection.parentNode.insertBefore(exportImportSection, buttonsSection);
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    .export-import-section {
      margin-top: 15px;
      border-top: 1px solid #e0e0e0;
      padding-top: 15px;
    }
    .export-import-section h2 {
      margin-top: 0;
    }
    .secondary-button {
      background-color: #f1f1f1;
      color: #333;
      padding: 8px 15px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
      margin-right: 10px;
      margin-bottom: 10px;
      transition: background-color 0.3s;
    }
    .secondary-button:hover {
      background-color: #e0e0e0;
    }
  `;
  document.head.appendChild(style);
}

// Export notes
function exportNotes() {
  chrome.runtime.sendMessage({
    action: 'exportNotes',
    format: 'txt'
  }, (response) => {
    if (response && response.error) {
      console.error('Error exporting notes:', response.error);
      alert('Error exporting notes: ' + response.error);
    } else if (response && response.success) {
      // Show success message
      exportButton.textContent = 'Exported!';
      setTimeout(() => {
        exportButton.textContent = 'Export Notes';
      }, 1500);
    }
  });
}

// Import notes
function importNotes(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    const content = e.target.result;
    const format = file.name.endsWith('.json') ? 'json' : 'txt';
    
    chrome.runtime.sendMessage({
      action: 'importNotes',
      content: content,
      format: format
    }, (response) => {
      if (response && response.error) {
        console.error('Error importing notes:', response.error);
        alert('Error importing notes: ' + response.error);
      } else if (response && response.success) {
        // Show success message
        importButton.textContent = 'Imported!';
        setTimeout(() => {
          importButton.textContent = 'Import Notes';
        }, 1500);
        
        // Notify content script to refresh notes
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          chrome.tabs.sendMessage(tabs[0].id, { 
            action: 'refreshNotes'
          });
        });
      }
    });
    
    // Reset file input
    fileInput.value = '';
  };
  
  reader.readAsText(file);
}
