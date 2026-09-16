// pages/order-canteen/order-canteen.js
const app = getApp();

Page({
  data: {
    canteens: [
      { id: 1, name: '第一食堂', desc: '一楼/二楼/三楼' },
      { id: 2, name: '第二食堂', desc: '清真/川味/面食' },
      { id: 3, name: '第三食堂', desc: '自选/盖饭/小吃' },
      { id: 4, name: '清真食堂', desc: '清真专属' }
    ],
    selectedCanteen: 1,
    foodList: '',
    payType: 'user',
    foodPrice: '',
    addresses: [],
    address: '',
    roomNo: '',
    deliveryTime: '',
    remark: '',
    serviceFee: 3,
    totalPrice: 3,
    submitting: false
  },

  onLoad() {
    this.loadPricing();
    this.loadAddresses();
  },

  async loadPricing() {
    try {
      const pricing = await app.request({ url: '/pricing', method: 'GET' });
      const canteen = (Array.isArray(pricing) ? pricing : []).find(p => p.type === 'canteen');
      if (canteen) {
        this.setData({ serviceFee: Number(canteen.base_price) || 3 });
        this.calcPrice();
      }
    } catch (err) {
      // 使用默认服务费
    }
  },

  async loadAddresses() {
    try {
      const list = await app.request({ url: '/users/addresses', method: 'GET' });
      this.setData({ addresses: Array.isArray(list) ? list : [] });
    } catch (err) {
      this.setData({ addresses: [] });
    }
  },

  selectCanteen(e) {
    this.setData({ selectedCanteen: e.currentTarget.dataset.id });
  },
  onFoodInput(e) { this.setData({ foodList: e.detail.value }); },
  onPayTypeChange(e) {
    this.setData({ payType: e.detail.value });
    this.calcPrice();
  },
  onFoodPriceInput(e) {
    this.setData({ foodPrice: e.detail.value });
    this.calcPrice();
  },
  onRoomNoInput(e) { this.setData({ roomNo: e.detail.value }); },
  onRemarkInput(e) { this.setData({ remark: e.detail.value }); },

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
          receiverName: selected.name,
          receiverPhone: selected.phone
        });
      }
    });
  },

  selectTime() {
    const times = ['立即送达（约30分钟）', '30分钟内', '1小时内', '2小时内'];
    wx.showActionSheet({
      itemList: times,
      success: (res) => this.setData({ deliveryTime: times[res.tapIndex] })
    });
  },

  uploadImage() { wx.showToast({ title: '图片上传开发中', icon: 'none' }); },

  calcPrice() {
    let total = this.data.serviceFee;
    if (this.data.payType === 'rider' && this.data.foodPrice) {
      total += parseFloat(this.data.foodPrice) || 0;
    }
    this.setData({ totalPrice: total.toFixed(2) });
  },

  async submitOrder() {
    if (this.data.submitting) return;
    if (!this.data.foodList) { wx.showToast({ title: '请输入菜品清单', icon: 'none' }); return; }
    if (!this.data.address) { wx.showToast({ title: '请选择送达地址', icon: 'none' }); return; }

    wx.showModal({
      title: '确认下单',
      content: `预估费用 ¥${this.data.totalPrice}，确认提交订单？`,
      success: async (res) => {
        if (!res.confirm) return;
        this.setData({ submitting: true });
        wx.showLoading({ title: '提交中...' });
        try {
          const canteen = this.data.canteens.find(c => c.id === this.data.selectedCanteen);
          await app.request({
            url: '/orders',
            method: 'POST',
            data: {
              type: 'canteen',
              campus: app.globalData.campus ? app.globalData.campus.name : '',
              pickup_address: canteen ? canteen.name : '',
              delivery_address: this.data.address + (this.data.roomNo ? ' ' + this.data.roomNo : ''),
              pickup_name: this.data.receiverName || '',
              pickup_phone: this.data.receiverPhone || '',
              delivery_name: this.data.receiverName || '',
              delivery_phone: this.data.receiverPhone || '',
              amount: parseFloat(this.data.totalPrice) || 0,
              tip: 0,
              insurance: 0,
              remark: this.data.remark,
              item_desc: this.data.foodList,
              item_size: 'normal'
            }
          });
          wx.hideLoading();
          this.setData({ submitting: false });
          wx.showToast({ title: '下单成功', icon: 'success' });
          setTimeout(() => wx.switchTab({ url: '/pages/order-list/order-list' }), 1000);
        } catch (err) {
          wx.hideLoading();
          this.setData({ submitting: false });
        }
      }
    });
  }
});
