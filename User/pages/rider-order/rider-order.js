// pages/rider-order/rider-order.js
const app = getApp();

const typeIconMap = { express: '📦', canteen: '🍜', supermarket: '🛒', errand: '📋', other: '🚀' };
const typeNameMap = { express: '快递代取', canteen: '食堂代购', supermarket: '商超代购', errand: '代办事务', other: '万能跑腿' };
const riderStatusMap = {
  picked: { tab: 'pending', text: '待取货' },
  delivering: { tab: 'delivering', text: '配送中' },
  delivered: { tab: 'delivered', text: '待确认' },
  completed: { tab: 'completed', text: '已完成' },
  cancelled: { tab: 'cancelled', text: '已取消' }
};

Page({
  data: {
    activeTab: 'pending',
    orders: [],
    filteredOrders: []
  },

  onShow() {
    this.loadOrders();
  },

  async loadOrders() {
    try {
      const data = await app.request({
        url: '/riders/orders',
        method: 'GET',
        data: { page: 1, pageSize: 50 }
      });
      const orders = (data.list || []).map(o => {
        const s = riderStatusMap[o.status] || { tab: 'pending', text: o.status };
        return {
          id: o.id,
          icon: typeIconMap[o.type] || '📦',
          typeName: typeNameMap[o.type] || o.type,
          status: s.tab,
          rawStatus: o.status,
          statusText: s.text,
          statusClass: s.tab,
          pickup: o.pickup_address || '',
          delivery: o.delivery_address || '',
          receiver: o.delivery_name || o.user_name || '',
          phone: o.delivery_phone || o.user_phone || '',
          remark: o.remark || '',
          price: Number(o.amount || 0).toFixed(2)
        };
      });
      this.setData({ orders });
      this.filterOrders();
    } catch (err) {
      this.setData({ orders: [] });
      this.filterOrders();
    }
  },

  switchTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab });
    this.filterOrders();
  },

  filterOrders() {
    const { activeTab, orders } = this.data;
    this.setData({ filteredOrders: orders.filter(o => o.status === activeTab) });
  },

  navigatePickup() {
    wx.showToast({ title: '正在打开地图导航...', icon: 'none' });
  },

  confirmPickup(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认取货',
      content: '请确认已取到物品，并拍照上传凭证。',
      confirmText: '已取货',
      success: (res) => {
        if (!res.confirm) return;
        app.request({ url: '/riders/orders/' + id + '/pickup', method: 'POST' })
          .then(() => {
            wx.showToast({ title: '取货成功', icon: 'success' });
            this.loadOrders();
          })
          .catch(() => {});
      }
    });
  },

  navigateDelivery() {
    wx.showToast({ title: '正在打开地图导航...', icon: 'none' });
  },

  confirmArrive(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认送达',
      content: '请确认已将物品送达，并拍照上传凭证。',
      confirmText: '已送达',
      success: (res) => {
        if (!res.confirm) return;
        app.request({ url: '/riders/orders/' + id + '/deliver', method: 'POST' })
          .then((data) => {
            wx.showToast({
              title: '已送达，等待用户确认',
              icon: 'success'
            });
            this.loadOrders();
          })
          .catch(() => {});
      }
    });
  },

  callUser(e) {
    const id = e.currentTarget.dataset.id;
    const order = this.data.orders.find(o => o.id === id);
    if (order && order.phone) {
      wx.makePhoneCall({ phoneNumber: order.phone });
    } else {
      wx.showToast({ title: '暂无联系电话', icon: 'none' });
    }
  },

  viewDetail(e) {
    wx.navigateTo({ url: '/pages/order-detail/order-detail?id=' + e.currentTarget.dataset.id });
  },

  goHall() {
    wx.navigateBack();
  }
});
