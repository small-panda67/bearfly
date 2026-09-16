// pages/wallet/wallet.js
const app = getApp();

const typeIconMap = {
  income: '💰',
  expense: '💸',
  order: '📦',
  withdraw: '🏦',
  recharge: '💳',
  refund: '↩️'
};

Page({
  data: {
    balance: '0.00',
    records: []
  },

  onShow() {
    this.loadWallet();
  },

  async loadWallet() {
    try {
      const data = await app.request({ url: '/users/wallet', method: 'GET' });
      const records = (data.records || []).map(r => {
        const isIncome = r.type === 'income' || r.type === 'recharge' || r.type === 'refund';
        return {
          id: r.id,
          icon: typeIconMap[r.source] || typeIconMap[r.type] || '📦',
          name: r.description || (r.type === 'income' ? '收入' : '支出'),
          time: r.created_at ? String(r.created_at).replace('T', ' ').substring(0, 16) : '',
          amount: (isIncome ? '+' : '-') + Number(r.amount).toFixed(2),
          type: isIncome ? 'income' : 'expense'
        };
      });
      this.setData({
        balance: (data.wallet && data.wallet.balance != null) ? Number(data.wallet.balance).toFixed(2) : '0.00',
        records
      });
    } catch (err) {
      this.setData({ balance: '0.00', records: [] });
    }
  },

  recharge() { wx.showToast({ title: '充值功能开发中', icon: 'none' }); },
  withdraw() { wx.showToast({ title: '请在跑腿员中心申请提现', icon: 'none' }); }
});
