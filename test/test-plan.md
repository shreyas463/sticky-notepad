# Sticky Notepad Browser Extension - Test Plan

## Overview
This document outlines the testing strategy for the Sticky Notepad browser extension to ensure it functions correctly across different browsers and websites.

## Test Environments
- Chrome (latest version)
- Brave (latest version)

## Test Categories

### 1. Installation Testing
- [ ] Extension installs correctly on Chrome
- [ ] Extension installs correctly on Brave
- [ ] Default settings are properly initialized on first install

### 2. UI Testing
- [ ] Popup interface loads correctly
- [ ] All settings controls work as expected
- [ ] Themes apply correctly (light, dark, yellow)
- [ ] Font size changes apply correctly
- [ ] Opacity slider works as expected

### 3. Notepad Functionality Testing
- [ ] Notepad appears correctly on web pages
- [ ] Text can be entered and edited
- [ ] Notepad persists when navigating between pages
- [ ] Notepad position is remembered between sessions
- [ ] Notepad can be dragged to different positions
- [ ] Notepad can be resized
- [ ] Minimize/maximize functionality works
- [ ] Hide/show functionality works
- [ ] Notepad stays in view when browser window is resized

### 4. Storage Testing
- [ ] Notes are saved automatically as typed
- [ ] Notes persist between browser sessions
- [ ] Switching between storage types (local/sync) works correctly
- [ ] Export functionality works correctly
- [ ] Import functionality works correctly
- [ ] Storage fallback mechanisms work when primary storage fails

### 5. Cross-site Testing
- [ ] Test on simple static websites
- [ ] Test on complex web applications
- [ ] Test on sites with iframes
- [ ] Test on sites with high z-index elements
- [ ] Test on sites with custom scrolling behavior

### 6. Performance Testing
- [ ] Extension doesn't significantly impact page load times
- [ ] Typing in the notepad is responsive
- [ ] Dragging and resizing are smooth
- [ ] Auto-save doesn't cause performance issues

### 7. Edge Case Testing
- [ ] Test with very large notes
- [ ] Test with special characters and multi-language text
- [ ] Test behavior when browser storage is nearly full
- [ ] Test behavior when offline

## Test Procedure

For each test case:
1. Document the expected behavior
2. Document the actual behavior
3. Document any discrepancies
4. Create screenshots for visual verification

## Test Results Documentation

Test results will be documented in separate files:
- `chrome-test-results.md` - Results from Chrome testing
- `brave-test-results.md` - Results from Brave testing

## Issue Tracking

Any issues found during testing will be documented with:
- Issue description
- Steps to reproduce
- Expected vs. actual behavior
- Browser and version information
- Screenshots if applicable
