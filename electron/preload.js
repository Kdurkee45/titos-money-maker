/**
 * Electron Preload Script
 * 
 * This script runs in the renderer process before the web content loads.
 * It provides a secure bridge between the renderer and main processes.
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Get available capture sources (windows and screens)
  getSources: () => ipcRenderer.invoke('get-sources'),
  
  // Capture a single frame from a source
  captureFrame: (sourceId) => ipcRenderer.invoke('capture-frame', sourceId),
  
  // Get display information
  getDisplayInfo: () => ipcRenderer.invoke('get-display-info'),
  
  // Start continuous capture at specified FPS
  startContinuousCapture: (options) => ipcRenderer.invoke('start-continuous-capture', options),
  
  // Stop continuous capture
  stopContinuousCapture: () => ipcRenderer.invoke('stop-continuous-capture'),
  
  // Listen for capture frame results
  onCaptureFrame: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('capture-frame-result', subscription);
    
    // Return cleanup function
    return () => {
      ipcRenderer.removeListener('capture-frame-result', subscription);
    };
  },
  
  // Check if running in Electron
  isElectron: true,
  
  // Platform info
  platform: process.platform,
  
  // Version info
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
  },
});

console.log('Preload script loaded');
console.log('Platform:', process.platform);
console.log('Electron version:', process.versions.electron);
