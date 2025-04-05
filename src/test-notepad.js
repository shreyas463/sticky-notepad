// Simple script to test notepad functionality
// This will be run in the browser console to diagnose issues

function testNotepad() {
  console.log("Testing Sticky Notepad functionality...");
  
  // Check if the notepad container exists
  const notepadContainer = document.querySelector('.sticky-notepad-container');
  console.log("Notepad container exists:", !!notepadContainer);
  
  if (!notepadContainer) {
    console.log("Creating notepad manually...");
    
    // Create container
    const container = document.createElement('div');
    container.className = 'sticky-notepad-container';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 300px;
      height: 200px;
      background-color: #fff;
      border: 1px solid #ccc;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      z-index: 10000;
      display: flex;
      flex-direction: column;
      border-radius: 5px;
      overflow: hidden;
    `;
    
    // Create header
    const header = document.createElement('div');
    header.className = 'sticky-notepad-header';
    header.style.cssText = `
      padding: 8px;
      background-color: #f0f0f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: move;
      border-bottom: 1px solid #ddd;
    `;
    
    // Create title
    const title = document.createElement('div');
    title.textContent = 'Sticky Notepad';
    title.style.fontWeight = 'bold';
    
    // Create controls
    const controls = document.createElement('div');
    
    // Create close button
    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.style.cssText = `
      background: none;
      border: none;
      font-size: 16px;
      cursor: pointer;
      margin-left: 5px;
    `;
    closeButton.onclick = () => container.style.display = 'none';
    
    // Create minimize button
    const minimizeButton = document.createElement('button');
    minimizeButton.textContent = '−';
    minimizeButton.style.cssText = `
      background: none;
      border: none;
      font-size: 16px;
      cursor: pointer;
    `;
    
    // Add buttons to controls
    controls.appendChild(minimizeButton);
    controls.appendChild(closeButton);
    
    // Add title and controls to header
    header.appendChild(title);
    header.appendChild(controls);
    
    // Create textarea
    const textarea = document.createElement('textarea');
    textarea.className = 'sticky-notepad-textarea';
    textarea.placeholder = 'Type your notes here...';
    textarea.style.cssText = `
      flex: 1;
      border: none;
      resize: none;
      padding: 10px;
      font-family: Arial, sans-serif;
      font-size: 14px;
      outline: none;
    `;
    
    // Add header and textarea to container
    container.appendChild(header);
    container.appendChild(textarea);
    
    // Add container to page
    document.body.appendChild(container);
    
    console.log("Notepad created manually!");
    
    // Make draggable
    let isDragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    
    header.addEventListener('mousedown', (e) => {
      isDragging = true;
      dragOffsetX = e.clientX - container.getBoundingClientRect().left;
      dragOffsetY = e.clientY - container.getBoundingClientRect().top;
    });
    
    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        container.style.left = (e.clientX - dragOffsetX) + 'px';
        container.style.top = (e.clientY - dragOffsetY) + 'px';
        container.style.right = 'auto';
      }
    });
    
    document.addEventListener('mouseup', () => {
      isDragging = false;
    });
    
    return container;
  }
  
  return notepadContainer;
}

// Run the test
testNotepad();
