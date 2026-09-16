// pages/mine/mine.js
const app = getApp();

Page({
  data: {
    user: {
      avatar: '👤',
      nickname: '未登录',
      verified: false,
      campus: '',
      balance: '0.00',
      coupons: 0,
      loggedIn: false,
      role: 'user'
    }
  },

  onShow() {
    this.loadUserInfo();
  },

  async loadUserInfo() {
    const userInfo = app.globalData.userInfo;
    if (!userInfo) {
      this.setData({
        user: { avatar: '👤', nickname: '点击登录', verified: false, campus: '', balance: '0.00', coupons: 0, loggedIn: false, role: 'user' }
      });
      return;
    }
    this.setData({
      'user.nickname': userInfo.nickname || '校园用户',
      'user.avatar': userInfo.avatar || '👤',
      'user.verified': userInfo.verified || false,
      'user.campus': (userInfo.campus && userInfo.campus.name) || userInfo.campus || '',
      'user.loggedIn': true,
      'user.role': app.globalData.role || userInfo.role || 'user'
    });

    // 拉取最新用户资料
    try {
      const profile = await app.request({ url: '/users/profile', method: 'GET' });
      if (profile) {
        app.globalData.userInfo = profile;
        wx.setStorageSync('userInfo', profile);
        this.setData({
          'user.nickname': profile.nickname || '校园用户',
          'user.avatar': profile.avatar || '👤',
          'user.campus': profile.campus || ''
        });
      }
    } catch (err) {}

    // 钱包余额
    try {
      const walletData = await app.request({ url: '/users/wallet', method: 'GET' });
      if (walletData && walletData.wallet) {
        this.setData({ 'user.balance': walletData.wallet.balance || '0.00' });
      }
    } catch (err) {}

    // 优惠券数量
    try {
      const couponData = await app.request({ url: '/users/coupons', method: 'GET' });
      if (Array.isArray(couponData)) {
        this.setData({ 'user.coupons': couponData.filter(c => c.status === 'unused').length });
      }
    } catch (err) {}
  },

  goProfile() {
    wx.showToast({ title: '个人资料开发中', icon: 'none' });
  },
  goWallet() {
    wx.navigateTo({ url: '/pages/wallet/wallet' });
  },
  goCoupon() {
    wx.navigateTo({ url: '/pages/coupon/coupon' });
  },
  goAllOrders() {
    wx.switchTab({ url: '/pages/order-list/order-list' });
  },
  goOrders(e) {
    wx.switchTab({ url: '/pages/order-list/order-list' });
  },
  goAfterSale() {
    wx.showToast({ title: '售后功能开发中', icon: 'none' });
  },
  goAddress() {
    wx.navigateTo({ url: '/pages/address/address' });
  },
  goReviews() {
    wx.showToast({ title: '评价管理开发中', icon: 'none' });
  },

  goRiderApply() {
    const userInfo = app.globalData.userInfo;
    if (!userInfo) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    wx.showModal({
      title: '跑腿员入驻',
      content: `将使用账号「${userInfo.nickname} / ${userInfo.phone || '未绑定手机'}」提交入驻申请，确认提交？`,
      confirmText: '立即申请',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await app.request({
            url: '/riders/apply',
            method: 'POST',
            data: {
              name: userInfo.nickname || '',
              phone: userInfo.phone || '',
              id_card: '',
              campus: userInfo.campus || (app.globalData.campus ? app.globalData.campus.name : ''),
              student_id: ''
            }
          });
          wx.showToast({ title: '申请已提交，等待审核', icon: 'success' });
        } catch (err) {}
      }
    });
  },

  goRiderCenter() {
    wx.navigateTo({ url: '/pages/rider-hall/rider-hall' });
  },

  goHelp() {
    wx.showToast({ title: '帮助中心开发中', icon: 'none' });
  },
  goService() {
    wx.showToast({ title: '客服功能开发中', icon: 'none' });
  },
  goFeedback() {
    wx.showToast({ title: '意见反馈开发中', icon: 'none' });
  },
  logout() {
    wx.showModal({
      title: '退出登录',
      content: '确定退出当前账号？',
      success: (res) => {
        if (!res.confirm) return;
        wx.removeStorageSync('token');
        wx.removeStorageSync('userInfo');
        app.globalData.token = '';
        app.globalData.userInfo = null;
        wx.redirectTo({ url: '/pages/login/login' });
      }
    });
  }
});
