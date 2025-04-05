# Storage Options for Chrome Extensions

## Chrome Storage API

Chrome provides several storage options specifically designed for extensions:

### 1. chrome.storage.local

- **Persistence**: Data is stored locally on the user's device and persists until the extension is removed
- **Size Limit**: 10 MB (5 MB in Chrome 113 and earlier)
- **Access**: Available to all extension contexts including content scripts
- **Best for**: Larger amounts of data that don't need to be synced across devices
- **Example**:
  ```javascript
  // Save data
  chrome.storage.local.set({ notes: noteContent }, function() {
    console.log('Note saved locally');
  });
  
  // Retrieve data
  chrome.storage.local.get(['notes'], function(result) {
    console.log('Retrieved note:', result.notes);
  });
  ```

### 2. chrome.storage.sync

- **Persistence**: Data is synced across all Chrome browsers where the user is logged in
- **Size Limit**: Approximately 100 KB total, with 8 KB per item
- **Access**: Available to all extension contexts including content scripts
- **Best for**: User preferences and smaller notes that should be available across devices
- **Example**:
  ```javascript
  // Save data
  chrome.storage.sync.set({ notePreferences: { fontSize: 14, color: '#000' } }, function() {
    console.log('Preferences synced');
  });
  
  // Retrieve data
  chrome.storage.sync.get(['notePreferences'], function(result) {
    console.log('Retrieved preferences:', result.notePreferences);
  });
  ```

### 3. chrome.storage.session

- **Persistence**: Data is stored in memory while the extension is loaded, cleared when browser restarts
- **Size Limit**: 10 MB (1 MB in Chrome 111 and earlier)
- **Access**: Not exposed to content scripts by default
- **Best for**: Temporary data that doesn't need to persist between browser sessions
- **Example**:
  ```javascript
  // Save data
  chrome.storage.session.set({ tempNote: draftContent }, function() {
    console.log('Draft saved to session');
  });
  
  // Retrieve data
  chrome.storage.session.get(['tempNote'], function(result) {
    console.log('Retrieved draft:', result.tempNote);
  });
  ```

## Google Drive API Integration

For cloud storage beyond Chrome's built-in options, Google Drive API can be integrated:

### Setup Requirements

1. **Google Cloud Project**:
   - Create a project in Google Cloud Console
   - Enable the Google Drive API
   - Configure OAuth consent screen
   - Create OAuth 2.0 credentials

2. **Permissions**:
   - Add `identity` permission to manifest.json
   - Request appropriate scopes (e.g., `https://www.googleapis.com/auth/drive.file`)

3. **Authentication Flow**:
   - Use `chrome.identity.getAuthToken` to get OAuth token
   - Use token to authenticate Drive API requests

### Implementation Example

```javascript
// In manifest.json
{
  "permissions": ["identity", "storage"],
  "oauth2": {
    "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
    "scopes": ["https://www.googleapis.com/auth/drive.file"]
  }
}

// In your JavaScript
function saveToGoogleDrive(noteContent, fileName) {
  chrome.identity.getAuthToken({ interactive: true }, function(token) {
    if (chrome.runtime.lastError || !token) {
      console.error("Error getting auth token:", chrome.runtime.lastError);
      return;
    }
    
    // Create file metadata
    const metadata = {
      name: fileName,
      mimeType: 'text/plain'
    };
    
    // Create multipart request body
    const boundary = 'notepad_boundary';
    const requestBody = 
      `--${boundary}\r\n` +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(metadata) + '\r\n' +
      `--${boundary}\r\n` +
      'Content-Type: text/plain\r\n\r\n' +
      noteContent + '\r\n' +
      `--${boundary}--`;
    
    // Send request to Drive API
    fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body: requestBody
    })
    .then(response => response.json())
    .then(data => {
      console.log('File saved to Drive:', data);
    })
    .catch(error => {
      console.error('Error saving to Drive:', error);
    });
  });
}
```

### Challenges with Google Drive Integration

1. **Authentication Complexity**: OAuth 2.0 flow can be complex to implement
2. **User Permissions**: Users must explicitly grant permission
3. **Rate Limiting**: API has usage quotas and rate limits
4. **Offline Access**: Need to handle cases when users are offline

## Hybrid Storage Approach

For our notepad extension, a hybrid approach is recommended:

1. **Primary Storage**: Use `chrome.storage.local` for immediate note saving
2. **Sync Preferences**: Use `chrome.storage.sync` for user preferences
3. **Cloud Backup**: Offer optional Google Drive integration for cloud backup
4. **Offline Support**: Implement offline capability with local storage and sync when online

This approach provides the best balance of performance, reliability, and user convenience.
