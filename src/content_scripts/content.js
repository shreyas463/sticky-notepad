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
let notepads = [];
let activeNoteId = 'note-1';

// Wait for DOM to be fully loaded before initializing
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeNotepad);
} else {
  initializeNotepad();
}

// Initialize the notepad
function initializeNotepad() {
  // Load settings first
  loadSettings(() => {
    // Load saved notes
    loadNoteContent();
  });
}

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

// This function has been moved to a more comprehensive version below

// Create the notepad elements
function createNotepad(id = 'note-1', position = { top: '20px', right: '20px', left: 'auto', bottom: 'auto' }) {
  // Create container
  const container = document.createElement('div');
  container.className = 'sticky-notepad-container';
  container.id = id;
  
  // Create header
  const header = document.createElement('div');
  header.className = 'sticky-notepad-header';
  
  // Create title
  const notepadTitle = document.createElement('div');
  notepadTitle.className = 'sticky-notepad-title';
  notepadTitle.textContent = 'Sticky Notepad';
  
  // Create controls
  const notepadControls = document.createElement('div');
  notepadControls.className = 'sticky-notepad-controls';
  
  // Create new note button
  const newNoteButton = document.createElement('button');
  newNoteButton.className = 'sticky-notepad-button';
  newNoteButton.textContent = '+';
  newNoteButton.title = 'New Note';
  newNoteButton.addEventListener('click', createNewNote);
  
  // Create minimize button
  const minimizeButton = document.createElement('button');
  minimizeButton.className = 'sticky-notepad-button';
  minimizeButton.textContent = '−';
  minimizeButton.title = 'Minimize';
  minimizeButton.addEventListener('click', (e) => toggleMinimize(e, id));
  
  // Create close button
  const closeButton = document.createElement('button');
  closeButton.className = 'sticky-notepad-button';
  closeButton.textContent = '×';
  closeButton.title = 'Hide';
  closeButton.addEventListener('click', (e) => hideNotepad(e, id));
  
  // Add buttons to controls
  notepadControls.appendChild(newNoteButton);
  notepadControls.appendChild(minimizeButton);
  notepadControls.appendChild(closeButton);
  
  // Add title and controls to header
  header.appendChild(notepadTitle);
  header.appendChild(notepadControls);
  
  // Create content area
  const notepadContent = document.createElement('div');
  notepadContent.className = 'sticky-notepad-content';
  
  // Create textarea
  const textarea = document.createElement('textarea');
  textarea.className = 'sticky-notepad-textarea';
  textarea.placeholder = 'Type your notes here...';
  textarea.addEventListener('input', (e) => handleNoteInput(e, id));
  textarea.addEventListener('keydown', handleTabKey);
  
  // Add textarea to content
  notepadContent.appendChild(textarea);
  
  // Create resize handle
  const resizeHandle = document.createElement('div');
  resizeHandle.className = 'sticky-notepad-resize-handle';
  resizeHandle.innerHTML = '⟋';
  resizeHandle.title = 'Resize';
  
  // Add header, content, and resize handle to container
  container.appendChild(header);
  container.appendChild(notepadContent);
  container.appendChild(resizeHandle);
  
  // Apply position
  container.style.top = position.top;
  container.style.right = position.right;
  container.style.left = position.left;
  container.style.bottom = position.bottom;
  
  // Add container to page
  document.body.appendChild(container);
  
  // Apply current settings
  applySettings(container, textarea);
  
  // Make notepad draggable
  setupDraggable(header, container);
  
  // Make notepad resizable
  setupResizable(resizeHandle, container);
  
  // Add window resize listener to keep notepad in view
  window.addEventListener('resize', () => keepNotepadInView(container));
  
  // Store references for the first notepad
  if (id === 'note-1') {
    notepadContainer = container;
    notepadHeader = header;
    notepadTextarea = textarea;
  }
  
  // Add to notepads array
  notepads.push({
    id: id,
    container: container,
    textarea: textarea,
    header: header
  });
  
  // Set as active note
  activeNoteId = id;
  
  return { container, textarea, header };
}

// Create a new note
function createNewNote() {
  // Generate a unique ID for the new note
  const noteId = `note-${notepads.length + 1}`;
  
  // Calculate position for the new note (offset from the active note)
  const activeNote = notepads.find(note => note.id === activeNoteId);
  let position = { top: '20px', right: '20px', left: 'auto', bottom: 'auto' };
  
  if (activeNote) {
    const rect = activeNote.container.getBoundingClientRect();
    position = {
      top: `${rect.top + 30}px`,
      left: `${rect.left + 30}px`,
      right: 'auto',
      bottom: 'auto'
    };
  }
  
  // Create the new notepad
  createNotepad(noteId, position);
  
  // Save the new note state
  saveNotes();
}

// Save all notes
function saveNotes() {
  const notes = notepads.map(notepad => {
    return {
      id: notepad.id,
      content: notepad.textarea.value,
      position: {
        top: notepad.container.style.top,
        right: notepad.container.style.right,
        left: notepad.container.style.left,
        bottom: notepad.container.style.bottom
      },
      size: {
        width: notepad.container.style.width,
        height: notepad.container.style.height
      }
    };
  });
  
  chrome.storage.local.set({ notes: notes });
}

// Setup draggable functionality
function setupDraggable(headerElement, containerElement) {
  headerElement.addEventListener('mousedown', (e) => {
    // Only handle drag from header area
    isDragging = true;
    dragOffsetX = e.clientX - containerElement.getBoundingClientRect().left;
    dragOffsetY = e.clientY - containerElement.getBoundingClientRect().top;
    
    // Set as active note
    activeNoteId = containerElement.id;
    headerElement.style.cursor = 'grabbing';
    
    // Prevent text selection during drag
    e.preventDefault();
  });
  
  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      // Calculate new position
      const newLeft = e.clientX - dragOffsetX;
      const newTop = e.clientY - dragOffsetY;
      
      // Update position
      containerElement.style.left = `${newLeft}px`;
      containerElement.style.top = `${newTop}px`;
      containerElement.style.right = 'auto';
      containerElement.style.bottom = 'auto';
      
      // Update position object for the main notepad
      if (containerElement === notepadContainer) {
        notepadPosition = {
          top: `${newTop}px`,
          left: `${newLeft}px`,
          right: 'auto',
          bottom: 'auto'
        };
      }
      
      // Save all notes
      saveNotes();
    }
  });
  
  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      headerElement.style.cursor = 'grab';
      
      // Keep notepad in view
      keepNotepadInView(containerElement);
    }
  });
}

// Setup resizable functionality
function setupResizable(resizeHandle, containerElement) {
  resizeHandle.addEventListener('mousedown', (e) => {
    isResizing = true;
    resizeStartX = e.clientX;
    resizeStartY = e.clientY;
    initialWidth = containerElement.offsetWidth;
    initialHeight = containerElement.offsetHeight;
    
    // Set as active note
    activeNoteId = containerElement.id;
    
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
        containerElement.style.width = width + 'px';
      }
      
      if (height >= minHeight) {
        containerElement.style.height = height + 'px';
      }
    }
  });
  
  document.addEventListener('mouseup', () => {
    if (isResizing) {
      isResizing = false;
      
      // Update size object for the main notepad
      if (containerElement === notepadContainer) {
        notepadSize = {
          width: notepadContainer.style.width,
          height: notepadContainer.style.height
        };
        saveNotepadPositionAndSize();
      }
      
      // Save all notes
      saveNotes();
    }
  });
}

// Keep notepad in view when window is resized
function keepNotepadInView(containerElement) {
  if (!containerElement) return;
  
  const rect = containerElement.getBoundingClientRect();
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  
  // Check if notepad is outside viewport
  if (rect.right > windowWidth) {
    containerElement.style.left = (windowWidth - rect.width) + 'px';
  }
  
  if (rect.bottom > windowHeight) {
    containerElement.style.top = (windowHeight - rect.height) + 'px';
  }
  
  if (rect.left < 0) {
    containerElement.style.left = '0px';
  }
  
  if (rect.top < 0) {
    containerElement.style.top = '0px';
  }
  
  // Update position for main notepad
  if (containerElement === notepadContainer) {
    notepadPosition = {
      top: notepadContainer.style.top,
      left: notepadContainer.style.left,
      right: 'auto',
      bottom: 'auto'
    };
    saveNotepadPositionAndSize();
  }
  
  // Save all notes
  saveNotes();
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
function handleNoteInput(e, noteId) {
  const textarea = e.target;
  
  // Update content for the main notepad
  if (noteId === 'note-1') {
    noteContent = textarea.value;
  }
  
  // Clear previous timer
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer);
  }
  
  // Set new timer for auto-save (500ms delay)
  autoSaveTimer = setTimeout(() => {
    saveNotes();
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
function applySettings(container, textarea) {
  // If specific container and textarea are provided, apply settings to them
  // Otherwise apply to all notepads
  if (container && textarea) {
    // Apply opacity
    container.style.opacity = currentSettings.opacity;
    
    // Apply font size
    textarea.style.fontSize = currentSettings.fontSize;
    
    // Apply theme
    container.classList.remove(
      'sticky-notepad-theme-light',
      'sticky-notepad-theme-dark',
      'sticky-notepad-theme-yellow'
    );
    container.classList.add(`sticky-notepad-theme-${currentSettings.theme}`);
  } else {
    // Apply to all notepads
    notepads.forEach(notepad => {
      // Apply opacity
      notepad.container.style.opacity = currentSettings.opacity;
      
      // Apply font size
      notepad.textarea.style.fontSize = currentSettings.fontSize;
      
      // Apply theme
      notepad.container.classList.remove(
        'sticky-notepad-theme-light',
        'sticky-notepad-theme-dark',
        'sticky-notepad-theme-yellow'
      );
      notepad.container.classList.add(`sticky-notepad-theme-${currentSettings.theme}`);
    });
    
    // Apply visibility only to the main notepad
    if (notepadContainer) {
      if (currentSettings.visible) {
        notepadContainer.classList.remove('sticky-notepad-hidden');
      } else {
        notepadContainer.classList.add('sticky-notepad-hidden');
      }
    }
  }
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
function toggleMinimize(e, noteId) {
  // Find the notepad to minimize
  const notepad = notepads.find(notepad => notepad.id === noteId);
  if (!notepad) return;
  
  // Toggle minimized state
  const isCurrentlyMinimized = notepad.container.classList.contains('sticky-notepad-minimized');
  
  if (isCurrentlyMinimized) {
    notepad.container.classList.remove('sticky-notepad-minimized');
  } else {
    notepad.container.classList.add('sticky-notepad-minimized');
  }
  
  // Update isMinimized for the main notepad
  if (noteId === 'note-1') {
    isMinimized = !isCurrentlyMinimized;
  }
}

// Hide notepad
function hideNotepad(e, noteId) {
  console.log('Hiding notepad with ID:', noteId);
  
  // If it's the main notepad, update settings
  if (noteId === 'note-1') {
    currentSettings.visible = false;
    
    // Apply settings to all notepads
    applySettings();
    
    // Update settings in storage
    chrome.storage.local.get('notepadSettings', (result) => {
      const settings = result.notepadSettings || {};
      settings.visible = false;
      chrome.storage.local.set({ notepadSettings: settings });
    });
  } else {
    // For additional notepads, just remove them from the DOM and the notepads array
    const notepadIndex = notepads.findIndex(notepad => notepad.id === noteId);
    console.log('Found notepad at index:', notepadIndex);
    
    if (notepadIndex !== -1) {
      const notepadToRemove = notepads[notepadIndex];
      // Remove from DOM
      if (notepadToRemove.container && document.body.contains(notepadToRemove.container)) {
        document.body.removeChild(notepadToRemove.container);
        console.log('Removed notepad from DOM');
      }
      
      // Remove from array
      notepads.splice(notepadIndex, 1);
      console.log('Removed notepad from array, remaining notepads:', notepads.length);
      
      // Save notes to update storage
      saveNotes();
    }
  }
}

// Save note content
function saveNoteContent() {
  saveNotes();
}

// Save all notes
function saveNotes() {
  if (notepads.length === 0) return;
  
  const notesToSave = notepads.map(notepad => {
    const rect = notepad.container.getBoundingClientRect();
    return {
      id: notepad.id,
      content: notepad.textarea.value,
      position: {
        top: notepad.container.style.top,
        right: notepad.container.style.right,
        left: notepad.container.style.left,
        bottom: notepad.container.style.bottom
      },
      size: {
        width: notepad.container.style.width || rect.width + 'px',
        height: notepad.container.style.height || rect.height + 'px'
      },
      isMinimized: notepad.container.classList.contains('sticky-notepad-minimized')
    };
  });
  
  chrome.storage.local.set({ notes: notesToSave }, () => {
    console.log('All notes saved');
  });
}

// Load note content
function loadNoteContent() {
  // Load all saved notes
  chrome.storage.local.get(['notes', 'noteContent'], (result) => {
    // Handle new multi-note format
    if (result.notes && Array.isArray(result.notes) && result.notes.length > 0) {
      // First, create the main notepad if it doesn't exist
      if (!notepadContainer) {
        const mainNote = result.notes.find(note => note.id === 'note-1');
        if (mainNote) {
          createNotepad('note-1', mainNote.position);
          if (notepadTextarea && mainNote.content) {
            notepadTextarea.value = mainNote.content;
          }
          if (mainNote.isMinimized) {
            notepadContainer.classList.add('sticky-notepad-minimized');
            isMinimized = true;
          }
          if (mainNote.size) {
            notepadContainer.style.width = mainNote.size.width;
            notepadContainer.style.height = mainNote.size.height;
          }
        } else {
          // If no main note found, create default
          createNotepad();
        }
      }
      
      // Then create all additional notes
      result.notes.forEach(note => {
        if (note.id !== 'note-1') {
          const { container, textarea } = createNotepad(note.id, note.position);
          if (textarea && note.content) {
            textarea.value = note.content;
          }
          if (note.isMinimized) {
            container.classList.add('sticky-notepad-minimized');
          }
          if (note.size) {
            container.style.width = note.size.width;
            container.style.height = note.size.height;
          }
        }
      });
    } 
    // Handle legacy single-note format
    else if (result.noteContent) {
      noteContent = result.noteContent;
      if (notepadTextarea) notepadTextarea.value = noteContent;
    }
  });
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
