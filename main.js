const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');

const DKonAPI = require('./api.js');
const AuthStorage = require('./storage.js');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 850,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#111',
    show: false, //  ready-to-show (white flashs)
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  if (AuthStorage.isLoggedIn()) {
    mainWindow.loadFile('index.html');
  } else {
    mainWindow.loadFile('login.html');
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // mainWindow.webContents.openDevTools({ mode: 'detach' });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ================================================
// ================= IPC HANDLERS =================
// ================================================


ipcMain.handle('login', async (event, username, password) => {
  try {
    const response = await DKonAPI.signIn(username, password);

    if (response.error === true) {
      return { success: false, error: 'Invalid username or password' };
    }

    const authData = {
      accessToken: response.accessToken,
      accountId: response.accountId.toString()
    };

    AuthStorage.save(authData);

    mainWindow.loadFile('index.html');
    return { success: true };
  } catch (err) {
    console.error('Login error:', err);
    return { success: false, error: err.message || 'Error Network' };
  }
});

ipcMain.handle('get-feed', async (event, itemId = 0) => {
  const auth = AuthStorage.get();
  if (!auth.accessToken) return { error: true, error_code: -1 };

  return await DKonAPI.getFeed({ ...auth, itemId: itemId || 0 });
});

ipcMain.handle('search-groups', async (event, query = '', itemId = 0) => {
  const auth = AuthStorage.get();
  if (!auth.accessToken) return { error: true };

  return await DKonAPI.searchGroups({ ...auth, query, itemId: itemId || 0 });
});

ipcMain.handle('group-wall', async (event, groupId, itemId = 0) => {
  const auth = AuthStorage.get();
  if (!auth.accessToken) return { error: true };

  return await DKonAPI.getGroupWall({ ...auth, groupId, itemId: itemId || 0 });
});

ipcMain.handle('follow-group', async (event, groupId) => {
  const auth = AuthStorage.get();
  if (!auth.accessToken) return { error: true };

  return await DKonAPI.followGroup({ ...auth, groupId });
});

ipcMain.handle('my-groups', async (event, itemId = 0) => {
  const auth = AuthStorage.get();
  if (!auth.accessToken) return { error: true };

  return await DKonAPI.getMyGroups({ ...auth, itemId: itemId || 0 });
});

ipcMain.handle('logout', () => {
  AuthStorage.clear();
  mainWindow.loadFile('login.html');
  return { success: true };
});

ipcMain.handle('check-auth', () => {
  return AuthStorage.isLoggedIn();
});