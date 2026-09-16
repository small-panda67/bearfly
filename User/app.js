// app.js - 校园跑腿小程序全局入口
const serverConfig = require('./config/index');

App({
  globalData: {
    userInfo: null,
    token: '',
    role: 'user', // user / rider / admin
    baseUrl: serverConfig.serverHost + serverConfig.apiPrefix,
    redirectingToLogin: false,
    campus: {
      id: 1,
      name: '主校区'
    }
  },

  onLaunch() {
    // 读取本地缓存
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');
    const role = wx.getStorageSync('role');
    if (token) this.globalData.token = token;
    if (userInfo) this.globalData.userInfo = userInfo;
    if (role) this.globalData.role = role;

    // 检查登录状态
    this.checkLogin();
  },

  // 登录状态检查
  checkLogin() {
    if (!this.globalData.token) {
      // 未登录，跳转到登录页（非 tabBar 页面）
      // wx.redirectTo({ url: '/pages/login/login' });
    }
  },

  // 统一请求封装
  request(options) {
    const { url, method = 'GET', data = {}, header = {} } = options;
    return new Promise((resolve, reject) => {
      wx.request({
        url: this.globalData.baseUrl + url,
        method,
        data,
        timeout: 15000,
        header: {
          'Content-Type': 'application/json',
          'Authorization': this.globalData.token ? 'Bearer ' + this.globalData.token : '',
          ...header
        },
        success: (res) => {
          if (res.statusCode === 401) {
            wx.removeStorageSync('token');
            wx.removeStorageSync('userInfo');
            wx.removeStorageSync('role');
            this.globalData.token = '';
            this.globalData.userInfo = null;
            this.globalData.role = 'user';
            if (!this.globalData.redirectingToLogin) {
              this.globalData.redirectingToLogin = true;
              wx.reLaunch({
                url: '/pages/login/login',
                complete: () => {
                  this.globalData.redirectingToLogin = false;
                }
              });
            }
            reject(new Error('未登录'));
            return;
          }
          if (res.data.code === 0) {
            resolve(res.data.data);
          } else {
            wx.showToast({ title: res.data.message || '请求失败', icon: 'none' });
            reject(res.data);
          }
        },
        fail: (err) => {
          wx.showToast({
            title: err.errMsg && err.errMsg.includes('timeout') ? '请求超时' : '网络异常',
            icon: 'none'
          });
          reject(err);
        }
      });
    });
  },

  // 角色切换
  switchRole(role) {
    this.globalData.role = role;
    wx.setStorageSync('role', role);
  }
});
