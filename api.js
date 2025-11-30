// api.js
const axios = require('axios');

const CLIENT_ID = 1302;
const API_BASE = 'https://api.dkon.app/api/v3/method';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  }
});

function formData(params) {
  return Object.keys(params)
    .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(params[key]))
    .join('&');
}

class DKonAPI {
  static async signIn(username, password) {
    const data = formData({
      clientId: CLIENT_ID,
      username,
      password
    });

    const res = await api.post('/account.signIn', data);
    return res.data;
  }

  static async getFeed({ accountId, accessToken, itemId = 0 }) {
    const data = formData({
      clientId: CLIENT_ID,
      accountId,
      accessToken,
      itemId
    });
    const res = await api.post('/feeds.get', data);
    return res.data;
  }

  static async searchGroups({ accountId, accessToken, itemId = 0, query = '' }) {
    const data = formData({
      clientId: CLIENT_ID,
      accountId,
      accessToken,
      itemId,
      query: query || ''
    });
    const res = await api.post('/group.search', data);
    return res.data;
  }

  static async getGroupWall({ accountId, accessToken, groupId, itemId = 0 }) {
    const data = formData({
      clientId: CLIENT_ID,
      accountId,
      accessToken,
      groupId,
      itemId
    });
    const res = await api.post('/group.getWall', data);
    return res.data;
  }

  static async followGroup({ accountId, accessToken, groupId }) {
    const data = formData({
      clientId: CLIENT_ID,
      accountId,
      accessToken,
      groupId
    });
    const res = await api.post('/group.follow', data);
    return res.data;
  }

  static async getMyGroups({ accountId, accessToken, itemId = 0 }) {
    const data = formData({
      clientId: CLIENT_ID,
      accountId,
      accessToken,
      itemId
    });
    const res = await api.post('/group.getMyGroups', data);
    return res.data;
  }
}

module.exports = DKonAPI;