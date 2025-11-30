const Store = require('electron-store');
const store = new Store();

class AuthStorage {
  static save(auth) {
    store.set('accessToken', auth.accessToken);
    store.set('accountId', auth.accountId);
  }

  static get() {
    return {
      accessToken: store.get('accessToken'),
      accountId: store.get('accountId')
    };
  }

  static isLoggedIn() {
    return !!store.get('accessToken');
  }

  static clear() {
    store.delete('accessToken');
    store.delete('accountId');
  }
}

module.exports = AuthStorage;