// pages/order-list/order-list.js
const app = getApp();

const typeIconMap = { express: '📦', canteen: '🍜', supermarket: '🛒', errand: '📋', other: '🚀' };
const typeNameMap = { express: '快递代取', canteen: '食堂代购', supermarket: '商超代购', errand: '代办事务', other: '万能跑腿' };
const statusTextMap = { pending: '待接单', picked: '待取货', delivering: '配送中', completed: '已完成', cancelled: '已取消' };

Page({
  data: {
    activeTab: 'all',
    orders: [],
    filteredOrders: [],
    loading: false
  },

  onLoad() {
    this.loadOrders();
  },

  onShow() {
    this.loadOrders();
  },

  async loadOrders() {
    this.setData({ loading: true });
    try {
      const status = this.data.activeTab === 'all' ? '' : this.data.activeTab;
      const data = await app.request({
        url: '/orders/my',
        method: 'GET',
        data: { status, page: 1, pageSize: 50 }
      });
      const orders = (data.list || []).map(o => this.formatOrder(o));
      this.setData({ orders });
      this.filterOrders();
    } catch (err) {
      this.setData({ orders: [] });
      this.filterOrders();
    } finally {
      this.setData({ loading: false });
    }
  },

  formatOrder(o) {
    const status = o.status;
    let actions = [];
    if (status === 'pending') {
      actions = [{ text: '取消订单', type: 'danger' }];
    } else if (status === 'picked' || status === 'delivering') {
      actions = [{ text: '联系骑手', type: '' }, { text: '确认收货', type: 'primary' }];
    } else if (status === 'completed') {
      actions = [{ text: '再来一单', type: '' }, { text: '评价', type: 'primary' }];
    }
    return {
      id: o.id,
      orderNo: o.order_no || '',
      icon: typeIconMap[o.type] || '📦',
      typeName: typeNameMap[o.type] || o.type,
      status,
      statusText: statusTextMap[status] || status,
      statusClass: status,
      pickup: o.pickup_address || '',
      delivery: o.delivery_address || '',
      time: o.created_at ? String(o.created_at).substring(5, 16) : '',
      price: o.amount,
      riderPhone: o.rider_phone || '',
      rated: !!o.rated,
      actions
    };
  },

  switchTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab });
    this.loadOrders();
  },

  filterOrders() {
    const { activeTab, orders } = this.data;
    let filtered = orders;
    if (activeTab === 'pending') {
      filtered = orders.filter(o => o.status === 'pending');
    } else if (activeTab === 'delivering') {
      filtered = orders.filter(o => ['picked', 'delivering'].includes(o.status));
    } else if (activeTab === 'completed') {
      filtered = orders.filter(o => o.status === 'completed');
    }
    this.setData({ filteredOrders: filtered });
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/order-detail/order-detail?id=' + id });
  },

  // 评价
  rateOrder(id) {
    wx.showActionSheet({
      itemList: ['⭐ 1星', '⭐⭐ 2星', '⭐⭐⭐ 3星', '⭐⭐⭐⭐ 4星', '⭐⭐⭐⭐⭐ 5星'],
      success: async (res) => {
        const rating = res.tapIndex + 1;
        wx.showModal({
          title: '评价内容',
          editable: true,
          placeholderText: '说说这次配送体验（选填）',
          success: async (mRes) => {
            if (!mRes.confirm) return;
            try {
              await app.request({
                url: '/orders/' + id + '/rate',
                method: 'POST',
                data: { rating, content: mRes.content || '' }
              });
              wx.showToast({ title: '评价成功', icon: 'success' });
              this.loadOrders();
            } catch (err) {}
          }
        });
      }
    });
  },

  handleAction(e) {
    const { action, id } = e.currentTarget.dataset;
    if (action === '确认收货') {
      wx.showModal({
        title: '确认收货',
        content: '确认已收到物品？',
        success: async (res) => {
          if (!res.confirm) return;
          try {
            await app.request({ url: '/orders/' + id + '/confirm', method: 'POST' });
            wx.showToast({ title: '已确认收货', icon: 'success' });
            this.loadOrders();
          } catch (err) {}
        }
      });
    } else if (action === '取消订单') {
      wx.showModal({
        title: '取消订单',
        content: '确定取消该订单？',
        success: async (res) => {
          if (!res.confirm) return;
          try {
            await app.request({
              url: '/orders/' + id + '/cancel',
              method: 'POST',
              data: { reason: '用户取消' }
            });
            wx.showToast({ title: '订单已取消', icon: 'success' });
            this.loadOrders();
          } catch (err) {}
        }
      });
    } else if (action === '联系骑手') {
      const order = this.data.orders.find(o => o.id === id);
      if (order && order.riderPhone) {
        wx.makePhoneCall({ phoneNumber: order.riderPhone });
      } else {
        wx.showToast({ title: '骑手联系方式获取中', icon: 'none' });
      }
    } else if (action === '评价') {
      this.rateOrder(id);
    } else if (action === '再来一单') {
      wx.switchTab({ url: '/pages/index/index' });
    }
  },

  goHome() {
    wx.switchTab({ url: '/pages/index/index' });
  }
});
