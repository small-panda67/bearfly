// pages/rider-mine/rider-mine.js
const app = getApp();

Page({
  data: {
    rider: {
      avatar: '🏃', name: '', level: 1,
      rating: '5.0', totalOrders: 0, verified: false,
      todayIncome: '0.00', balance: '0.00', monthOrders: 0,
      completionRate: 100, avgTime: 20, goodRate: 100, onTimeRate: 100,
      deposit: '0.00'
    }
  },

  onShow() {
    this.loadRider();
  },

  async loadRider() {
    try {
      const profile = await app.request({ url: '/riders/profile', method: 'GET' });
      if (profile) {
        this.setData({
          'rider.name': profile.name || '校园跑腿员',
          'rider.rating': profile.rating || '5.0',
          'rider.totalOrders': profile.total_orders || 0,
          'rider.verified': profile.status === 'approved' || profile.status === 'normal' || !!profile.is_verified
        });
      }
    } catch (err) {}

    try {
      const income = await app.request({ url: '/riders/income', method: 'GET' });
      if (income) {
        this.setData({
          'rider.todayIncome': Number(income.todayIncome || 0).toFixed(2),
          'rider.balance': Number(income.balance || 0).toFixed(2),
          'rider.monthOrders': income.monthOrders || 0
        });
      }
    } catch (err) {}
  },

  goWallet() { wx.showToast({ title: '钱包开发中', icon: 'none' }); },

  goWithdraw() {
    const balance = this.data.rider.balance;
    wx.showModal({
      title: '提现',
      content: '可提现金额 ¥' + balance,
      editable: true,
      placeholderText: '请输入提现金额',
      success: async (res) => {
        if (!res.confirm) return;
        const amount = parseFloat(res.content);
        if (!amount || amount <= 0) {
          wx.showToast({ title: '请输入正确金额', icon: 'none' });
          return;
        }
        try {
          const data = await app.request({
            url: '/riders/withdraw',
            method: 'POST',
            data: { amount }
          });
          wx.showToast({ title: '提现申请已提交', icon: 'success' });
          if (data && data.balance != null) {
            this.setData({ 'rider.balance': Number(data.balance).toFixed(2) });
          }
          this.loadRider();
        } catch (err) {}
      }
    });
  },

  goDeposit() { wx.showToast({ title: '保证金管理开发中', icon: 'none' }); },
  goIncome() { wx.showToast({ title: '收入明细开发中', icon: 'none' }); },
  goSettings() { wx.showToast({ title: '接单设置开发中', icon: 'none' }); },
  goLevel() { wx.showToast({ title: '等级权益开发中', icon: 'none' }); },
  goHelp() { wx.showToast({ title: '帮助中心开发中', icon: 'none' }); },
  goService() { wx.showToast({ title: '客服功能开发中', icon: 'none' }); },

  switchToUser() {
    app.switchRole('user');
    wx.showToast({ title: '已切换到用户模式', icon: 'success' });
    setTimeout(() => {
      wx.switchTab({ url: '/pages/index/index' });
    }, 1000);
  }
});
