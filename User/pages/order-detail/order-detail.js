// pages/order-detail/order-detail.js
const app = getApp();

const typeNameMap = { express: '快递代取', canteen: '食堂代购', supermarket: '商超代购', errand: '代办事务', other: '万能跑腿' };
const statusDescMap = {
  pending: '订单已提交，等待跑腿员接单',
  picked: '跑腿员已接单，等待取货',
  delivering: '跑腿员正在配送中，请耐心等待',
  delivered: '跑腿员已送达，请确认收货',
  completed: '订单已完成，感谢使用',
  cancelled: '订单已取消'
};

Page({
  data: {
    orderId: null,
    order: {
      id: '',
      typeName: '',
      status: '',
      statusText: '',
      statusDesc: '',
      progress: 0,
      pickup: '',
      delivery: '',
      remark: '',
      createTime: '',
      totalPrice: '0.00',
      rider: null,
      tracks: [],
      fees: [],
      actions: []
    }
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ orderId: options.id });
      this.loadDetail(options.id);
    }
  },

  async loadDetail(id) {
    wx.showLoading({ title: '加载中...' });
    try {
      const o = await app.request({ url: '/orders/' + id, method: 'GET' });
      wx.hideLoading();
      this.formatDetail(o);
    } catch (err) {
      wx.hideLoading();
    }
  },

  formatDetail(o) {
    const status = o.status;
    let progress = 1;
    if (status === 'pending') progress = 1;
    else if (status === 'picked') progress = 2;
    else if (status === 'delivering') progress = o.delivered_at ? 4 : 3;
    else if (status === 'delivered') progress = 4;
    else if (status === 'completed') progress = 4;

    let actions = [];
    if (status === 'pending') {
      actions = [{ text: '取消订单', type: 'danger' }];
    } else if (status === 'picked' || status === 'delivering') {
      actions = [{ text: '联系骑手', type: '' }];
    } else if (status === 'delivered') {
      actions = [{ text: '联系骑手', type: '' }, { text: '确认收货', type: 'primary' }];
    } else if (status === 'completed' && !o.rated) {
      actions = [{ text: '评价', type: 'primary' }];
    }

    const tracks = (o.tracks || []).slice().reverse().map(t => ({
      text: t.description || t.status,
      time: t.created_at ? String(t.created_at).substring(11, 16) : '',
      active: true
    }));

    const fees = [
      { name: '配送费', value: '¥' + (o.amount || '0.00') },
      { name: '小费', value: '¥' + (o.tip || '0.00') }
    ];
    if (Number(o.insurance)) fees.push({ name: '保价费', value: '¥1.00' });

    this.setData({
      order: {
        id: o.order_no || String(o.id),
        typeName: typeNameMap[o.type] || o.type,
        status,
        statusText: { pending: '待接单', picked: '待取货', delivering: '配送中', delivered: '待确认', completed: '已完成', cancelled: '已取消' }[status] || status,
        statusDesc: statusDescMap[status] || '',
        progress,
        pickup: o.pickup_address || '',
        delivery: o.delivery_address || '',
        remark: o.remark || '',
        createTime: o.created_at ? String(o.created_at).replace('T', ' ').substring(0, 19) : '',
        totalPrice: o.pay_amount || o.amount || '0.00',
        rider: o.rider_name ? {
          name: o.rider_name, avatar: '🏃', rating: '5.0', orders: 0
        } : null,
        riderPhone: o.rider_phone || '',
        tracks,
        fees,
        actions
      }
    });
  },

  callRider() {
    const phone = this.data.order.riderPhone;
    if (phone) {
      wx.makePhoneCall({ phoneNumber: phone });
    } else {
      wx.showToast({ title: '骑手联系方式获取中', icon: 'none' });
    }
  },

  messageRider() {
    wx.showToast({ title: '消息功能开发中', icon: 'none' });
  },

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
              this.loadDetail(id);
            } catch (err) {}
          }
        });
      }
    });
  },

  handleAction(e) {
    const action = e.currentTarget.dataset.action;
    const id = this.data.orderId;
    if (action === '确认收货') {
      wx.showModal({
        title: '确认收货',
        content: '确认已收到物品？',
        success: async (res) => {
          if (!res.confirm) return;
          try {
            await app.request({ url: '/orders/' + id + '/confirm', method: 'POST' });
            wx.showToast({ title: '已确认收货', icon: 'success' });
            this.loadDetail(id);
          } catch (err) {}
        }
      });
    } else if (action === '联系骑手') {
      this.callRider();
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
            this.loadDetail(id);
          } catch (err) {}
        }
      });
    } else if (action === '申请退款') {
      wx.showToast({ title: '退款功能开发中', icon: 'none' });
    } else if (action === '评价') {
      this.rateOrder(id);
    }
  }
});
