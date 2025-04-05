# Sticky Notepad Browser Extension

A browser extension for Chrome and Brave that provides a persistent notepad that stays visible while browsing the web.

## Features

- **Persistent Notepad**: Stays visible while scrolling and navigating between websites
- **Draggable Interface**: Position the notepad anywhere on your screen
- **Resizable**: Adjust the size of the notepad to suit your needs
- **Multiple Themes**: Choose between light, dark, and yellow themes
- **Customizable**: Adjust opacity and font size
- **Auto-Save**: Notes are saved automatically as you type
- **Storage Options**: Choose between local storage or sync across devices
- **Import/Export**: Export your notes as text files and import them later

## Installation

### Chrome Web Store (Recommended)

1. Visit the Chrome Web Store (link to be added once published)
2. Click "Add to Chrome"
3. Confirm the installation

### Manual Installation (Developer Mode)

1. Download the latest release ZIP file from the Releases page
2. Extract the ZIP file to a folder on your computer
3. Open Chrome/Brave and navigate to `chrome://extensions/`
4. Enable "Developer mode" by toggling the switch in the top-right corner
5. Click the "Load unpacked" button
6. Browse to the extracted folder and select it

## Usage

After installation, click the Sticky Notepad icon in your browser toolbar to show the notepad. The notepad will appear in the top-right corner of your browser window.

- **Move it**: Drag the notepad by its header to reposition it
- **Resize it**: Drag the resize handle in the bottom-right corner
- **Minimize it**: Click the "−" button in the top-right of the notepad
- **Hide it**: Click the "×" button or toggle visibility in the popup

For more detailed instructions, see the [User Guide](docs/user-guide.md).

## Development

### Project Structure

```
sticky-notepad-extension/
├── manifest.json           # Extension configuration
├── popup/                  # Popup UI files
├── content_scripts/        # Content scripts injected into web pages
├── background/             # Background service worker
└── icons/                  # Extension icons
```

### Building from Source

1. Clone this repository
2. Make your changes
3. Run `./package.sh` to create a distribution package

## Documentation

- [Installation Guide](docs/installation-guide.md)
- [User Guide](docs/user-guide.md)
- [Code Structure](docs/code-structure.md)

## License

MIT License - See LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
