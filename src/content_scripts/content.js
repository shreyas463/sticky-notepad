// Enhanced content script for Sticky Notepad extension

// Global variables
let notepadContainer = null;
let notepadTextarea = null;
let notepadHeader = null;
let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;
let isMinimized = false;
let isResizing = false;
let resizeStartX = 0;
let resizeStartY = 0;
let initialWidth = 0;
let initialHeight = 0;
let currentSettings = {
  visible: true,
  opacity: 0.9,
  fontSize: '14px',
  theme: 'light',
  storageType: 'local'
};
let noteContent = '';
let notepadPosition = { top: '20px', right: '20px', left: 'auto', bottom: 'auto' };
let notepadSize = { width: '300px', height: '200px' };
let autoSaveTimer = null;

// Initialize when the content script is injected
initializeNotepad();

// Listen for messages from popup or background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateSettings') {
    updateNotepadSettings(message.settings);
    sendResponse({ success: true });
  } else if (message.action === 'toggleVisibility') {
    toggleNotepadVisibility(message.visible);
    sendResponse({ success: true });
  } else if (message.action === 'initializeNotepad') {
    // Reinitialize if needed (e.g., after navigation)
    if (!notepadContainer || !document.body.contains(notepadContainer)) {
      initializeNotepad();
    }
    sendResponse({ success: true });
  }
  return true; // Keep the message channel open for async response
});

// Initialize the notepad
function initializeNotepad() {
  // Load settings first
  loadSettings(() => {
    // Create notepad if it doesn't exist
    if (!notepadContainer) {
      createNotepad();
    }
    
    // Load saved note content
    loadNoteContent();
    
    // Load saved position and size
    loadNotepadPositionAndSize();
  });
}

// Create the notepad elements
function createNotepad() {
  // Create container
  notepadContainer = document.createElement('div');
  notepadContainer.className = 'sticky-notepad-container';
  
  // Create header
  notepadHeader = document.createElement('div');
  notepadHeader.className = 'sticky-notepad-header';
  
  // Create title
  const notepadTitle = document.createElement('div');
  notepadTitle.className = 'sticky-notepad-title';
  notepadTitle.textContent = 'Sticky Notepad';
  
  // Create controls
  const notepadControls = document.createElement('div');
  notepadControls.className = 'sticky-notepad-controls';
  
  // Create minimize button
  const minimizeButton = document.createElement('button');
  minimizeButton.className = 'sticky-notepad-button';
  minimizeButton.textContent = '−';
  minimizeButton.title = 'Minimize';
  minimizeButton.addEventListener('click', toggleMinimize);
  
  // Create close button
  const closeButton = document.createElement('button');
  closeButton.className = 'sticky-notepad-button';
  closeButton.textContent = '×';
  closeButton.title = 'Hide';
  closeButton.addEventListener('click', hideNotepad);
  
  // Add buttons to controls
  notepadControls.appendChild(minimizeButton);
  notepadControls.appendChild(closeButton);
  
  // Add title and controls to header
  notepadHeader.appendChild(notepadTitle);
  notepadHeader.appendChild(notepadControls);
  
  // Create content area
  const notepadContent = document.createElement('div');
  notepadContent.className = 'sticky-notepad-content';
  
  // Create textarea
  notepadTextarea = document.createElement('textarea');
  notepadTextarea.className = 'sticky-notepad-textarea';
  notepadTextarea.placeholder = 'Type your notes here...';
  notepadTextarea.addEventListener('input', handleNoteInput);
  notepadTextarea.addEventListener('keydown', handleTabKey);
  
  // Add textarea to content
  notepadContent.appendChild(notepadTextarea);
  
  // Create resize handle
  const resizeHandle = document.createElement('div');
  resizeHandle.className = 'sticky-notepad-resize-handle';
  resizeHandle.innerHTML = '⟋';
  resizeHandle.title = 'Resize';
  
  // Add header, content, and resize handle to container
  notepadContainer.appendChild(notepadHeader);
  notepadContainer.appendChild(notepadContent);
  notepadContainer.appendChild(resizeHandle);
  
  // Add container to page
  document.body.appendChild(notepadContainer);
  
  // Apply current settings
  applySettings();
  
  // Make notepad draggable
  setupDraggable();
  
  // Make notepad resizable
  setupResizable(resizeHandle);
  
  // Add window resize listener to keep notepad in view
  window.addEventListener('resize', keepNotepadInView);
}

// Setup draggable functionality
function setupDraggable() {
  notepadHeader.addEventListener('mousedown', (e) => {
    // Only handle drag from header area
    isDragging = true;
    dragOffsetX = e.clientX - notepadContainer.getBoundingClientRect().left;
    dragOffsetY = e.clientY - notepadContainer.getBoundingClientRect().top;
    notepadHeader.style.cursor = 'grabbing';
    
    // Prevent text selection during drag
    e.preventDefault();
  });
  
  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      const left = e.clientX - dragOffsetX;
      const top = e.clientY - dragOffsetY;
      
      notepadContainer.style.left = left + 'px';
      notepadContainer.style.top = top + 'px';
      notepadContainer.style.right = 'auto';
      notepadContainer.style.bottom = 'auto';
    }
  });
  
  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      notepadHeader.style.cursor = 'grab';
      
      // Save position
      notepadPosition = {
        top: notepadContainer.style.top,
        left: notepadContainer.style.left,
        right: 'auto',
        bottom: 'auto'
      };
      saveNotepadPositionAndSize();
    }
  });
}

// Setup resizable functionality
function setupResizable(resizeHandle) {
  resizeHandle.addEventListener('mousedown', (e) => {
    isResizing = true;
    resizeStartX = e.clientX;
    resizeStartY = e.clientY;
    initialWidth = notepadContainer.offsetWidth;
    initialHeight = notepadContainer.offsetHeight;
    
    // Prevent text selection during resize
    e.preventDefault();
  });
  
  document.addEventListener('mousemove', (e) => {
    if (isResizing) {
      const width = initialWidth + (e.clientX - resizeStartX);
      const height = initialHeight + (e.clientY - resizeStartY);
      
      // Set minimum size
      const minWidth = 200;
      const minHeight = 150;
      
      if (width >= minWidth) {
        notepadContainer.style.width = width + 'px';
      }
      
      if (height >= minHeight) {
        notepadContainer.style.height = height + 'px';
      }
    }
  });
  
  document.addEventListener('mouseup', () => {
    if (isResizing) {
      isResizing = false;
      
      // Save size
      notepadSize = {
        width: notepadContainer.style.width,
        height: notepadContainer.style.height
      };
      saveNotepadPositionAndSize();
    }
  });
}

// Keep notepad in view when window is resized
function keepNotepadInView() {
  if (!notepadContainer) return;
  
  const rect = notepadContainer.getBoundingClientRect();
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  
  // Check if notepad is outside viewport
  if (rect.right > windowWidth) {
    notepadContainer.style.left = (windowWidth - rect.width) + 'px';
  }
  
  if (rect.bottom > windowHeight) {
    notepadContainer.style.top = (windowHeight - rect.height) + 'px';
  }
  
  if (rect.left < 0) {
    notepadContainer.style.left = '0px';
  }
  
  if (rect.top < 0) {
    notepadContainer.style.top = '0px';
  }
  
  // Update position
  notepadPosition = {
    top: notepadContainer.style.top,
    left: notepadContainer.style.left,
    right: 'auto',
    bottom: 'auto'
  };
  saveNotepadPositionAndSize();
}

// Handle tab key in textarea
function handleTabKey(e) {
  if (e.key === 'Tab') {
    e.preventDefault();
    
    // Insert tab at cursor position
    const start = this.selectionStart;
    const end = this.selectionEnd;
    
    this.value = this.value.substring(0, start) + '\t' + this.value.substring(end);
    
    // Move cursor after tab
    this.selectionStart = this.selectionEnd = start + 1;
    
    // Trigger input event to save content
    handleNoteInput();
  }
}

// Handle note input with debounced auto-save
function handleNoteInput() {
  noteContent = notepadTextarea.value;
  
  // Clear previous timer
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer);
  }
  
  // Set new timer for auto-save (500ms delay)
  autoSaveTimer = setTimeout(() => {
    saveNoteContent();
  }, 500);
}

// Load settings from storage
function loadSettings(callback) {
  chrome.storage.local.get('notepadSettings', (result) => {
    if (result.notepadSettings) {
      currentSettings = result.notepadSettings;
    }
    if (callback) callback();
  });
}

// Apply settings to notepad
function applySettings() {
  if (!notepadContainer) return;
  
  // Apply visibility
  if (currentSettings.visible) {
    notepadContainer.classList.remove('sticky-notepad-hidden');
  } else {
    notepadContainer.classList.add('sticky-notepad-hidden');
  }
  
  // Apply opacity
  notepadContainer.style.opacity = currentSettings.opacity;
  
  // Apply font size
  notepadTextarea.style.fontSize = currentSettings.fontSize;
  
  // Apply theme
  notepadContainer.classList.remove(
    'sticky-notepad-theme-light',
    'sticky-notepad-theme-dark',
    'sticky-notepad-theme-yellow'
  );
  notepadContainer.classList.add(`sticky-notepad-theme-${currentSettings.theme}`);
}

// Update notepad settings
function updateNotepadSettings(settings) {
  currentSettings = settings;
  applySettings();
}

// Toggle notepad visibility
function toggleNotepadVisibility(visible) {
  currentSettings.visible = visible;
  applySettings();
}

// Toggle minimize state
function toggleMinimize() {
  isMinimized = !isMinimized;
  
  if (isMinimized) {
    notepadContainer.classList.add('sticky-notepad-minimized');
  } else {
    notepadContainer.classList.remove('sticky-notepad-minimized');
  }
}

// Hide notepad
function hideNotepad() {
  currentSettings.visible = false;
  applySettings();
  
  // Update settings in storage
  chrome.storage.local.get('notepadSettings', (result) => {
    const settings = result.notepadSettings || {};
    settings.visible = false;
    chrome.storage.local.set({ notepadSettings: settings });
  });
}

// Save note content
function saveNoteContent() {
  // Use the appropriate storage based on settings
  if (currentSettings.storageType === 'sync') {
    chrome.storage.sync.set({ noteContent: noteContent });
  } else {
    chrome.storage.local.set({ noteContent: noteContent });
  }
}

// Load note content
function loadNoteContent() {
  // Try to load from both storage types, prioritize the current setting
  if (currentSettings.storageType === 'sync') {
    chrome.storage.sync.get('noteContent', (result) => {
      if (result.noteContent) {
        noteContent = result.noteContent;
        if (notepadTextarea) notepadTextarea.value = noteContent;
      } else {
        // Fallback to local if not found in sync
        chrome.storage.local.get('noteContent', (localResult) => {
          if (localResult.noteContent) {
            noteContent = localResult.noteContent;
            if (notepadTextarea) notepadTextarea.value = noteContent;
          }
        });
      }
    });
  } else {
    chrome.storage.local.get('noteContent', (result) => {
      if (result.noteContent) {
        noteContent = result.noteContent;
        if (notepadTextarea) notepadTextarea.value = noteContent;
      }
    });
  }
}

// Save notepad position and size
function saveNotepadPositionAndSize() {
  chrome.storage.local.set({ 
    notepadPosition: notepadPosition,
    notepadSize: notepadSize
  });
}

// Load notepad position and size
function loadNotepadPositionAndSize() {
  chrome.storage.local.get(['notepadPosition', 'notepadSize'], (result) => {
    if (result.notepadPosition) {
      notepadPosition = result.notepadPosition;
      
      // Apply position
      notepadContainer.style.top = notepadPosition.top;
      notepadContainer.style.left = notepadPosition.left;
      notepadContainer.style.right = notepadPosition.right;
      notepadContainer.style.bottom = notepadPosition.bottom;
    }
    
    if (result.notepadSize) {
      notepadSize = result.notepadSize;
      
      // Apply size
      notepadContainer.style.width = notepadSize.width;
      notepadContainer.style.height = notepadSize.height;
    }
    
    // Ensure notepad is in view
    keepNotepadInView();
  });
}
