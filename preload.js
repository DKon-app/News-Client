const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('dkonAPI', {
  login: (username, password) => ipcRenderer.invoke('login', username, password),
  getFeed: (itemId) => ipcRenderer.invoke('get-feed', itemId),
  searchGroups: (query, itemId) => ipcRenderer.invoke('search-groups', query, itemId),
  getGroupWall: (groupId, itemId) => ipcRenderer.invoke('group-wall', groupId, itemId),
  followGroup: (groupId) => ipcRenderer.invoke('follow-group', groupId),
  getMyGroups: (itemId) => ipcRenderer.invoke('my-groups', itemId),
  isLoggedIn: () => require('./storage').isLoggedIn(),
  logout: () => {
    require('./storage').clear();
    window.location.href = 'login.html';
  }
});