/**
 * Electron Main Process
 * 
 * This is the main entry point for the Electron desktop application.
 * It creates the browser window and handles native screen capture.
 */

const { app, BrowserWindow, ipcMain, desktopCapturer, screen, systemPreferences } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

let mainWindow = null;

// Keep a reference to prevent garbage collection
let captureInterval = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      // Enable web security but allow screen capture
      webSecurity: true,
    },
    // Modern frameless look with custom title bar
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0f172a', // slate-900
    show: false, // Don't show until ready
  });

  // Load the Next.js app
  // Default to port 3000 (matches package.json dev script)
  const devPort = process.env.DEV_PORT || '3000';
  const startUrl = isDev 
    ? `http://localhost:${devPort}`
    : `file://${path.join(__dirname, '../out/index.html')}`;
  
  mainWindow.loadURL(startUrl);

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Open DevTools in development
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (captureInterval) {
      clearInterval(captureInterval);
      captureInterval = null;
    }
  });
}

// Request screen recording permission on macOS
async function requestScreenPermission() {
  if (process.platform === 'darwin') {
    const status = systemPreferences.getMediaAccessStatus('screen');
    console.log('Screen recording permission status:', status);
    
    // Note: On macOS, the status may show 'denied' even when permission is granted
    // for command-line launched apps. We'll proceed anyway and let the capture fail
    // if permission is truly not granted.
    if (status === 'denied') {
      console.log('Screen recording permission status is "denied" - will attempt capture anyway');
      console.log('If capture fails, please check System Preferences > Privacy & Security > Screen Recording');
    }
    // Always return true and let the actual capture attempt determine if it works
    return true;
  }
  // Windows and Linux don't require explicit permission
  return true;
}

// Handle screen capture request from renderer
ipcMain.handle('get-sources', async () => {
  try {
    const hasPermission = await requestScreenPermission();
    if (!hasPermission) {
      return { error: 'Screen recording permission not granted' };
    }

    const sources = await desktopCapturer.getSources({
      types: ['window', 'screen'],
      thumbnailSize: { width: 320, height: 180 },
      fetchWindowIcons: true,
    });

    // Convert sources to serializable format
    return sources.map(source => ({
      id: source.id,
      name: source.name,
      thumbnail: source.thumbnail.toDataURL(),
      appIcon: source.appIcon ? source.appIcon.toDataURL() : null,
      display_id: source.display_id,
    }));
  } catch (error) {
    console.error('Error getting sources:', error);
    return { error: error.message };
  }
});

// Handle capture frame request
ipcMain.handle('capture-frame', async (event, sourceId) => {
  try {
    const sources = await desktopCapturer.getSources({
      types: ['window', 'screen'],
      thumbnailSize: { width: 1920, height: 1080 }, // Full HD capture
    });

    const source = sources.find(s => s.id === sourceId);
    if (!source) {
      return { error: 'Source not found' };
    }

    // Return the thumbnail as a data URL
    // For higher quality, we'll use the stream approach in the renderer
    return {
      dataUrl: source.thumbnail.toDataURL(),
      width: source.thumbnail.getSize().width,
      height: source.thumbnail.getSize().height,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('Error capturing frame:', error);
    return { error: error.message };
  }
});

// Get primary display info
ipcMain.handle('get-display-info', () => {
  const primaryDisplay = screen.getPrimaryDisplay();
  return {
    id: primaryDisplay.id,
    bounds: primaryDisplay.bounds,
    workArea: primaryDisplay.workArea,
    scaleFactor: primaryDisplay.scaleFactor,
    rotation: primaryDisplay.rotation,
  };
});

// Start continuous capture
ipcMain.handle('start-continuous-capture', async (event, { sourceId, fps = 1 }) => {
  if (captureInterval) {
    clearInterval(captureInterval);
  }

  const intervalMs = 1000 / fps;
  
  captureInterval = setInterval(async () => {
    try {
      const sources = await desktopCapturer.getSources({
        types: ['window', 'screen'],
        thumbnailSize: { width: 1920, height: 1080 },
      });

      const source = sources.find(s => s.id === sourceId);
      if (source && mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('capture-frame-result', {
          dataUrl: source.thumbnail.toDataURL(),
          width: source.thumbnail.getSize().width,
          height: source.thumbnail.getSize().height,
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      console.error('Continuous capture error:', error);
    }
  }, intervalMs);

  return { success: true };
});

// Stop continuous capture
ipcMain.handle('stop-continuous-capture', () => {
  if (captureInterval) {
    clearInterval(captureInterval);
    captureInterval = null;
  }
  return { success: true };
});

// App lifecycle
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handle certificate errors for development
if (isDev) {
  app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
    event.preventDefault();
    callback(true);
  });
}

console.log('Electron main process started');
console.log('Development mode:', isDev);
