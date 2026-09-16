// pages/message/message.js
const app = getApp();

const typeIconMap = { express: '📦', canteen: '🍜', supermarket: '🛒', errand: '📋', other: '🚀' };
const statusTextMap = { pending: '待接单', picked: '待取货', delivering: '配送中', delivered: '待确认', completed: '已完成', cancelled: '已取消' };

Page({
  data: {
    counts: { order: 0, system: 0, finance: 0, service: 0 },
    messages: []
  },

  onShow() {
    this.loadMessages();
  },

  async loadMessages() {
    const messages = [];

    // 订单消息
    try {
      const data = await app.request({
        url: '/orders/my',
        method: 'GET',
        data: { status: '', page: 1, pageSize: 10 }
      });
      (data.list || []).forEach(o => {
        messages.push({
          id: 'order_' + o.id,
          type: 'order',
          icon: typeIconMap[o.type] || '📦',
          title: (statusTextMap[o.status] || o.status) + (o.order_no ? ' ' + o.order_no : ''),
          desc: `${o.pickup_address} → ${o.delivery_address}`,
          time: o.created_at ? String(o.created_at).substring(5, 16) : '',
          read: o.status === 'completed' || o.status === 'cancelled'
        });
      });
    } catch (err) {}

    // 系统公告
    try {
      const notices = await app.request({ url: '/notices', method: 'GET' });
      (Array.isArray(notices) ? notices : []).forEach(n => {
        messages.push({
          id: 'notice_' + n.id,
          type: 'system',
          icon: '📢',
          title: n.title || '平台公告',
          desc: n.content || '',
          time: n.created_at ? String(n.created_at).substring(5, 16) : '',
          read: false
        });
      });
    } catch (err) {}

    const counts = {
      order: messages.filter(m => m.type === 'order' && !m.read).length,
      system: messages.filter(m => m.type === 'system' && !m.read).length,
      finance: 0,
      service: 0
    };
    this.setData({ messages, counts });
  },

  goCategory(e) {
    const cat = e.currentTarget.dataset.cat;
    if (cat === 'order') {
      wx.switchTab({ url: '/pages/order-list/order-list' });
    } else {
      wx.showToast({ title: '该分类消息敬请期待', icon: 'none' });
    }
  },

  readMessage(e) {
    const id = e.currentTarget.dataset.id;
    const messages = this.data.messages.map(m => {
      if (m.id === id) m.read = true;
      return m;
    });
    this.setData({ messages });
    const target = messages.find(m => m.id === id);
    if (target && target.id.startsWith('order_')) {
      wx.navigateTo({ url: '/pages/order-detail/order-detail?id=' + target.id.replace('order_', '') });
    }
  }
});
