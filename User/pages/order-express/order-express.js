// pages/order-express/order-express.js
const app = getApp();

Page({
  data: {
    station: '',
    pickupCode: '',
    receiverName: '',
    receiverPhone: '',
    size: 'small',
    addresses: [],
    address: '',
    addressId: null,
    roomNo: '',
    deliveryTime: '',
    insured: false,
    remark: '',
    tip: 0,
    baseFee: 2,
    distanceFee: 0,
    totalPrice: 2,
    priceMap: { small: 2, medium: 4, large: 6 },
    submitting: false
  },

  onLoad() {
    this.loadPricing();
    this.loadAddresses();
  },

  // 拉取快递代取定价
  async loadPricing() {
    try {
      const pricing = await app.request({ url: '/pricing', method: 'GET' });
      const express = (Array.isArray(pricing) ? pricing : []).find(p => p.type === 'express');
      if (express) {
        const base = Number(express.base_price) || 2;
        this.setData({
          priceMap: { small: base, medium: base + 2, large: base + 4 },
          baseFee: base
        });
        this.calcPrice();
      }
    } catch (err) {
      // 使用默认定价
    }
  },

  // 拉取用户地址
  async loadAddresses() {
    try {
      const list = await app.request({ url: '/users/addresses', method: 'GET' });
      this.setData({ addresses: Array.isArray(list) ? list : [] });
    } catch (err) {
      this.setData({ addresses: [] });
    }
  },

  // 选择驿站（校内取件点为固定运营点）
  selectStation() {
    const stations = ['菜鸟驿站（东门）', '京东快递点', '顺丰快递点', '中通快递点', '圆通快递点', '邮政快递点'];
    wx.showActionSheet({
      itemList: stations,
      success: (res) => {
        this.setData({ station: stations[res.tapIndex] });
      }
    });
  },

  onPickupCodeInput(e) { this.setData({ pickupCode: e.detail.value }); },
  onReceiverNameInput(e) { this.setData({ receiverName: e.detail.value }); },
  onReceiverPhoneInput(e) { this.setData({ receiverPhone: e.detail.value }); },
  onRoomNoInput(e) { this.setData({ roomNo: e.detail.value }); },
  onRemarkInput(e) { this.setData({ remark: e.detail.value }); },

  selectSize(e) {
    const size = e.currentTarget.dataset.size;
    this.setData({ size, baseFee: this.data.priceMap[size] });
    this.calcPrice();
  },

  // 选择送达地址（来自已保存地址）
  selectAddress() {
    const addresses = this.data.addresses;
    if (!addresses.length) {
      wx.showToast({ title: '请先在"我的-地址管理"添加地址', icon: 'none' });
      return;
    }
    wx.showActionSheet({
      itemList: addresses.map(a => `${a.building} ${a.room}`),
      success: (res) => {
        const selected = addresses[res.tapIndex];
        this.setData({
          address: `${selected.building} ${selected.room}`,
          addressId: selected.id,
          receiverName: selected.name,
          receiverPhone: selected.phone
        });
      }
    });
  },

  selectTime() {
    const times = ['立即送达（约30分钟）', '30分钟内', '1小时内', '2小时内', '今天12:00前', '今天18:00前'];
    wx.showActionSheet({
      itemList: times,
      success: (res) => {
        this.setData({ deliveryTime: times[res.tapIndex] });
      }
    });
  },

  onInsuredChange(e) {
    this.setData({ insured: e.detail.value });
    this.calcPrice();
  },

  selectTip(e) {
    this.setData({ tip: parseInt(e.currentTarget.dataset.tip) });
    this.calcPrice();
  },

  // 价格计算
  calcPrice() {
    let total = this.data.baseFee + this.data.distanceFee + this.data.tip;
    if (this.data.insured) total += 1;
    this.setData({ totalPrice: total });
  },

  // 提交订单
  async submitOrder() {
    if (this.data.submitting) return;
    if (!this.data.station) {
      wx.showToast({ title: '请选择快递驿站', icon: 'none' });
      return;
    }
    if (!this.data.pickupCode) {
      wx.showToast({ title: '请输入取件码', icon: 'none' });
      return;
    }
    if (!this.data.address) {
      wx.showToast({ title: '请选择送达地址', icon: 'none' });
      return;
    }
    if (!this.data.receiverName || !this.data.receiverPhone) {
      wx.showToast({ title: '请填写收件人姓名和电话', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '确认下单',
      content: `预估费用 ¥${this.data.totalPrice}，确认提交订单？`,
      success: async (res) => {
        if (!res.confirm) return;
        this.setData({ submitting: true });
        wx.showLoading({ title: '提交中...' });
        try {
          await app.request({
            url: '/orders',
            method: 'POST',
            data: {
              type: 'express',
              campus: app.globalData.campus ? app.globalData.campus.name : '',
              pickup_address: this.data.station,
              delivery_address: this.data.address + (this.data.roomNo ? ' ' + this.data.roomNo : ''),
              pickup_name: this.data.receiverName,
              pickup_phone: this.data.receiverPhone,
              delivery_name: this.data.receiverName,
              delivery_phone: this.data.receiverPhone,
              amount: this.data.baseFee + this.data.distanceFee,
              tip: this.data.tip,
              insurance: this.data.insured ? 1 : 0,
              remark: this.data.remark,
              item_desc: this.data.station + ' 取件码:' + this.data.pickupCode,
              item_size: this.data.size
            }
          });
          wx.hideLoading();
          this.setData({ submitting: false });
          wx.showToast({ title: '下单成功', icon: 'success' });
          setTimeout(() => {
            wx.switchTab({ url: '/pages/order-list/order-list' });
          }, 1000);
        } catch (err) {
          wx.hideLoading();
          this.setData({ submitting: false });
        }
      }
    });
  }
});
