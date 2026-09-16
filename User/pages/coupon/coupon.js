// pages/coupon/coupon.js
const app = getApp();

Page({
  data: {
    activeTab: 'available',
    coupons: [],
    rawCoupons: []
  },

  onShow() {
    this.loadCoupons();
  },

  async loadCoupons() {
    try {
      const list = await app.request({ url: '/users/coupons', method: 'GET' });
      const raw = (Array.isArray(list) ? list : []).map(c => {
        const statusMap = { unused: 'available', used: 'used', expired: 'expired' };
        return {
          id: c.id,
          amount: c.amount,
          threshold: c.threshold,
          name: c.name || '优惠券',
          desc: c.type === 'all' ? '全场通用' : (c.type || '专属优惠券'),
          expire: c.expire_at ? String(c.expire_at).substring(0, 10) + '到期' : '长期有效',
          status: statusMap[c.status] || 'available'
        };
      });
      this.setData({ rawCoupons: raw });
      this.applyTab();
    } catch (err) {
      this.setData({ coupons: [], rawCoupons: [] });
    }
  },

  switchTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab });
    this.applyTab();
  },

  applyTab() {
    const { activeTab, rawCoupons } = this.data;
    this.setData({
      coupons: rawCoupons.filter(c => activeTab === 'all' ? true : c.status === activeTab)
    });
  },

  useCoupon() { wx.switchTab({ url: '/pages/index/index' }); }
});
