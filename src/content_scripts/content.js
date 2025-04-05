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
  try {
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
  } catch (error) {
    console.error('Error handling message:', error);
    sendResponse({ success: false, error: error.message });
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
  try {
    const notes = notepads.map(notepad => {
      if (!notepad || !notepad.container || !notepad.textarea) {
        console.error('Invalid notepad object in saveNotes:', notepad);
        return null;
      }
      
      return {
        id: notepad.id,
        content: notepad.textarea.value,
        isMinimized: notepad.container.classList.contains('sticky-notepad-minimized'),
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
    }).filter(note => note !== null);
    
    // Save to storage
    chrome.storage.local.set({ notes: notes }, () => {
      if (chrome.runtime.lastError) {
        console.error('Error saving notes:', chrome.runtime.lastError);
      }
    });
  } catch (error) {
    console.error('Error in saveNotes:', error);
  }
}

// Setup resizable functionality
function setupResizable(resizeHandle, containerElement) {
  resizeHandle.addEventListener('mousedown', (e) => {
    isResizing = true;
    resizeStartX = e.clientX;
    resizeStartY = e.clientY;
    initialWidth = parseInt(window.getComputedStyle(containerElement).width, 10);
    initialHeight = parseInt(window.getComputedStyle(containerElement).height, 10);
    
    // Prevent text selection during resize
    e.preventDefault();
  });
  
  document.addEventListener('mousemove', (e) => {
    if (isResizing) {
      // Calculate new size
      const newWidth = initialWidth + (e.clientX - resizeStartX);
      const newHeight = initialHeight + (e.clientY - resizeStartY);
      
      // Apply minimum size constraints
      const minWidth = 200;
      const minHeight = 100;
      
      // Update size
      containerElement.style.width = `${Math.max(newWidth, minWidth)}px`;
      containerElement.style.height = `${Math.max(newHeight, minHeight)}px`;
      
      // Update size object for the main notepad
      if (containerElement === notepadContainer) {
        notepadSize = {
          width: containerElement.style.width,
          height: containerElement.style.height
        };
      }
      
      // Save all notes
      saveNotes();
    }
  });
}

// Setup draggable functionality
function setupDraggable(headerElement, containerElement) {
  try {
    // Set default cursor for header
    headerElement.style.cursor = 'grab';
    
    headerElement.addEventListener('mousedown', (e) => {
      try {
        // Only allow dragging from the header, not the buttons
        if (e.target !== headerElement && !e.target.classList.contains('sticky-notepad-title')) {
          return;
        }
        
        isDragging = true;
        dragOffsetX = e.clientX - containerElement.getBoundingClientRect().left;
        dragOffsetY = e.clientY - containerElement.getBoundingClientRect().top;
        
        // Set as active note
        activeNoteId = containerElement.id;
        
        // Change cursor style
        headerElement.style.cursor = 'grabbing';
        
        // Prevent text selection during drag
        e.preventDefault();
      } catch (mousedownError) {
        console.error('Error in mousedown event:', mousedownError);
      }
    });
    
    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        try {
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
        } catch (mousemoveError) {
          console.error('Error in mousemove event:', mousemoveError);
          isDragging = false;
        }
      }
    });
    
    document.addEventListener('mouseup', () => {
      if (isDragging) {
        try {
          isDragging = false;
          headerElement.style.cursor = 'grab';
          
          // Keep notepad in view
          keepNotepadInView(containerElement);
          
          // Save all notes with updated positions
          saveNotes();
        } catch (mouseupError) {
          console.error('Error in mouseup event:', mouseupError);
        }
      }
    });
  } catch (setupError) {
    console.error('Error setting up draggable functionality:', setupError);
  }
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
  try {
    // Find the notepad to minimize
    const notepad = notepads.find(notepad => notepad.id === noteId);
    if (!notepad || !notepad.container) {
      console.error('Cannot find notepad or container for ID:', noteId);
      return;
    }
    
    // Toggle minimized state
    const isCurrentlyMinimized = notepad.container.classList.contains('sticky-notepad-minimized');
    console.log('Current minimized state for', noteId, ':', isCurrentlyMinimized);
    
    try {
      if (isCurrentlyMinimized) {
        notepad.container.classList.remove('sticky-notepad-minimized');
      } else {
        notepad.container.classList.add('sticky-notepad-minimized');
      }
      
      // Update isMinimized for the main notepad
      if (noteId === 'note-1') {
        isMinimized = !isCurrentlyMinimized;
      }
      
      // Save the state
      saveNotes();
    } catch (classError) {
      console.error('Error toggling minimized class:', classError);
    }
  } catch (error) {
    console.error('Error in toggleMinimize:', error);
  }
}

// Hide notepad
function hideNotepad(e, noteId) {
  try {
    console.log('Hiding notepad with ID:', noteId);
    
    // If it's the main notepad, update settings
    if (noteId === 'note-1') {
      currentSettings.visible = false;
      
      // Apply settings to all notepads
      try {
        applySettings();
      } catch (error) {
        console.error('Error applying settings:', error);
      }
      
      // Update settings in storage
      try {
        chrome.storage.local.get('notepadSettings', (result) => {
          if (chrome.runtime.lastError) {
            console.error('Error getting notepad settings:', chrome.runtime.lastError);
            return;
          }
          
          const settings = result.notepadSettings || {};
          settings.visible = false;
          
          chrome.storage.local.set({ notepadSettings: settings }, () => {
            if (chrome.runtime.lastError) {
              console.error('Error saving notepad settings:', chrome.runtime.lastError);
            }
          });
        });
      } catch (error) {
        console.error('Error accessing chrome storage:', error);
      }
    } else {
      // For additional notepads, just remove them from the DOM and the notepads array
      try {
        const notepadIndex = notepads.findIndex(notepad => notepad.id === noteId);
        console.log('Found notepad at index:', notepadIndex);
        
        if (notepadIndex !== -1) {
          try {
            const notepadToRemove = notepads[notepadIndex];
            // Remove from DOM
            if (notepadToRemove.container && document.body && document.body.contains(notepadToRemove.container)) {
              document.body.removeChild(notepadToRemove.container);
              console.log('Removed notepad from DOM');
            } else {
              console.log('Notepad container not found in DOM or already removed');
            }
          } catch (domError) {
            console.error('Error removing notepad from DOM:', domError);
          }
          
          // Remove from array
          try {
            notepads.splice(notepadIndex, 1);
            console.log('Removed notepad from array, remaining notepads:', notepads.length);
          } catch (arrayError) {
            console.error('Error removing notepad from array:', arrayError);
          }
          
          // Save notes to update storage
          try {
            saveNotes();
          } catch (saveError) {
            console.error('Error saving notes after removal:', saveError);
          }
        }
      } catch (findError) {
        console.error('Error finding notepad in array:', findError);
      }
    }
  } catch (error) {
    console.error('Unhandled error in hideNotepad function:', error);
  }
}

// Save note content
function saveNoteContent() {
  saveNotes();
}

// Save all notes
function saveNotes() {
  try {
    if (notepads.length === 0) return;
    
    const notesToSave = notepads.map(notepad => {
      try {
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
      } catch (error) {
        console.error('Error processing notepad for saving:', error);
        // Return a minimal valid object if we can't get all the data
        return {
          id: notepad.id || 'unknown',
          content: '',
          position: { top: '20px', right: '20px', left: 'auto', bottom: 'auto' },
          size: { width: '300px', height: '200px' },
          isMinimized: false
        };
      }
    });
    
    try {
      chrome.storage.local.set({ notes: notesToSave }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error saving notes:', chrome.runtime.lastError);
        } else {
          console.log('All notes saved successfully');
        }
      });
    } catch (error) {
      console.error('Error accessing chrome.storage:', error);
    }
  } catch (error) {
    console.error('Error in saveNotes function:', error);
  }
}

// Load note content
function loadNoteContent() {
  try {
    chrome.storage.local.get(['notes', 'notepadSettings', 'noteContent'], (result) => {
      try {
        if (chrome.runtime.lastError) {
          console.error('Error loading notes from storage:', chrome.runtime.lastError);
          // Create a default notepad even if we can't load from storage
          if (notepads.length === 0) {
            createNotepad('note-1');
          }
          return;
        }
        
        // Load settings
        if (result.notepadSettings) {
          currentSettings = { ...currentSettings, ...result.notepadSettings };
        }
        
        // Check if we have saved notes
        if (result.notes && Array.isArray(result.notes) && result.notes.length > 0) {
          // We have multiple notes saved in the new format
          result.notes.forEach(note => {
            try {
              // Check if this notepad already exists
              const existingNotepad = notepads.find(n => n.id === note.id);
              if (!existingNotepad) {
                createNotepad(note.id, note.position);
                const notepad = notepads.find(n => n.id === note.id);
                if (notepad) {
                  // Set content
                  notepad.textarea.value = note.content || '';
                  
                  // Set size if available
                  if (note.size) {
                    notepad.container.style.width = note.size.width || '300px';
                    notepad.container.style.height = note.size.height || '200px';
                  }
                  
                  // Set minimized state if available
                  if (note.isMinimized) {
                    notepad.container.classList.add('sticky-notepad-minimized');
                  }
                }
              }
            } catch (noteError) {
              console.error('Error creating notepad from saved data:', noteError);
            }
          });
        } else if (result.noteContent) {
          // Legacy format - single note
          // Create the default notepad if it doesn't exist
          const existingMainNotepad = notepads.find(n => n.id === 'note-1');
          if (!existingMainNotepad) {
            createNotepad('note-1');
            const mainNotepad = notepads.find(n => n.id === 'note-1');
            if (mainNotepad) {
              mainNotepad.textarea.value = result.noteContent || '';
            }
          }
        } else {
          // No saved notes, create a default one if none exist
          if (notepads.length === 0) {
            createNotepad('note-1');
          }
        }
        
        // Apply settings to all notepads
        try {
          applySettings();
        } catch (settingsError) {
          console.error('Error applying settings:', settingsError);
        }
      } catch (resultError) {
        console.error('Error processing storage results:', resultError);
        // Create a default notepad as fallback
        if (notepads.length === 0) {
          createNotepad('note-1');
        }
      }
    });
  } catch (storageError) {
    console.error('Error accessing chrome.storage:', storageError);
    // Create a default notepad as fallback
    if (notepads.length === 0) {
      createNotepad('note-1');
    }
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
