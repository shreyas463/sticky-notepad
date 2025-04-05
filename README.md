# Sticky Notepad Browser Extension

A browser extension for Chrome and Brave that provides a persistent notepad that stays visible while browsing the web. Keep your notes, thoughts, and ideas handy while you browse!

## Features

- **Persistent Notepad**: Stays visible while scrolling and navigating between websites
- **Multiple Notes**: Create multiple notepads for different tasks or categories
- **Draggable Interface**: Position the notepad anywhere on your screen with an intuitive grab handle
- **Resizable**: Adjust the size of the notepad to suit your needs
- **Multiple Themes**: Choose between light, dark, and yellow themes
- **Customizable**: Adjust opacity and font size to your preference
- **Auto-Save**: Notes are saved automatically as you type
- **Storage Options**: Choose between local storage or sync across devices
- **Minimizable**: Temporarily minimize notepads to reduce screen space usage
- **Tab Support**: Properly handles tab key input for indentation

## Recent Updates

- **Improved Error Handling**: Comprehensive error handling to prevent extension context invalidation
- **Fixed Cursor Style**: Better visual feedback when dragging notepads
- **Enhanced Minimization**: Fixed issues with the minimize functionality
- **Close Button Fix**: Properly removes notepads when closed
- **Storage Access Improvements**: Better handling of Chrome storage access

## Installation

### Chrome Web Store (Coming Soon)

1. Visit the Chrome Web Store (link to be added once published)
2. Click "Add to Chrome"
3. Confirm the installation

### Manual Installation (Developer Mode)

1. Download the latest release ZIP file from the [Releases page](https://github.com/shreyas463/sticky-notepad/releases) or clone this repository
2. If you cloned the repository, run `./package.sh` to create the distribution package
3. Extract the ZIP file (if downloaded) or navigate to the `dist` folder (if cloned)
4. Open Chrome/Brave and navigate to `chrome://extensions/`
5. Enable "Developer mode" by toggling the switch in the top-right corner
6. Click the "Load unpacked" button
7. Browse to the extracted folder or the `dist/sticky-notepad-extension` directory and select it

## Usage

After installation, the notepad will automatically appear in the top-right corner of your browser window.

### Basic Controls

- **Move**: Drag the notepad by its header to reposition it
- **Resize**: Drag the resize handle in the bottom-right corner
- **Minimize**: Click the "−" button to collapse the notepad
- **Create New Note**: Click the "+" button to create an additional notepad
- **Hide/Close**: Click the "×" button to hide the notepad

### Advanced Features

- **Settings**: Click the extension icon in the toolbar to access settings
- **Theme Selection**: Change between light, dark, and yellow themes
- **Font Size**: Adjust the text size for better readability
- **Opacity**: Change how transparent the notepad appears
- **Storage Type**: Choose between local storage or sync across devices

## Troubleshooting

If you encounter any issues:

1. Check the browser console for error messages (Right-click > Inspect > Console)
2. Try reloading the extension from the extensions page
3. If problems persist, please [submit an issue](https://github.com/shreyas463/sticky-notepad/issues) with details about the problem

## Development

### Project Structure

```
sticky-notepad-complete/
├── src/                    # Source code
│   ├── manifest.json       # Extension configuration
│   ├── popup/              # Popup UI files
│   ├── content_scripts/    # Content scripts injected into web pages
│   ├── background/         # Background service worker
│   └── icons/              # Extension icons
├── dist/                   # Distribution files
├── docs/                   # Documentation
└── package.sh              # Build script
```

### Building from Source

1. Clone this repository: `git clone https://github.com/shreyas463/sticky-notepad.git`
2. Make your changes to files in the `src` directory
3. Run `./package.sh` to create a distribution package in the `dist` folder
4. Load the extension from `dist/sticky-notepad-extension` using Chrome's developer mode

### Technology Stack

- **JavaScript**: Core functionality
- **HTML/CSS**: User interface
- **Chrome Extension API**: Browser integration
- **Chrome Storage API**: Data persistence

## Documentation

- [User Guide](docs/user-guide.md)
- [Code Structure](docs/code-structure.md)
- [API Reference](docs/api-reference.md)

## License

MIT License - See LICENSE file for details.

## Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request

## Contact

If you have any questions or suggestions, please open an issue on GitHub.
