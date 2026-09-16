// pages/address/address.js
const app = getApp();

Page({
  data: {
    addresses: []
  },

  onShow() {
    this.loadAddresses();
  },

  async loadAddresses() {
    try {
      const list = await app.request({ url: '/users/addresses', method: 'GET' });
      const addresses = (Array.isArray(list) ? list : []).map(a => ({
        id: a.id,
        name: a.name,
        phone: a.phone,
        address: a.building,
        roomNo: a.room,
        campus: a.campus || '',
        isDefault: !!a.is_default
      }));
      this.setData({ addresses });
    } catch (err) {
      this.setData({ addresses: [] });
    }
  },

  selectAddress() { wx.showToast({ title: '已选择地址', icon: 'success' }); },

  async setDefault(e) {
    const id = e.currentTarget.dataset.id;
    const target = this.data.addresses.find(a => a.id === id);
    if (!target) return;
    try {
      await app.request({
        url: '/users/addresses/' + id,
        method: 'PUT',
        data: {
          name: target.name,
          phone: target.phone,
          campus: target.campus || (app.globalData.campus ? app.globalData.campus.name : ''),
          building: target.address,
          room: target.roomNo,
          is_default: 1
        }
      });
      wx.showToast({ title: '已设为默认', icon: 'success' });
      this.loadAddresses();
    } catch (err) {}
  },

  editAddress(e) {
    const target = this.data.addresses.find(a => a.id === e.currentTarget.dataset.id);
    if (target) this.openForm(target);
  },

  addAddress() {
    this.openForm(null);
  },

  // 链式弹窗填写/编辑地址（无需额外表单页）
  openForm(target) {
    const isEdit = !!target;
    const campus = (app.globalData.campus && app.globalData.campus.name) || '';
    const state = {
      id: isEdit ? target.id : null,
      name: isEdit ? target.name : '',
      phone: isEdit ? target.phone : '',
      campus: isEdit ? (target.campus || campus) : campus,
      building: isEdit ? target.address : '',
      room: isEdit ? target.roomNo : '',
      is_default: isEdit ? (target.isDefault ? 1 : 0) : 0
    };

    const askName = () => wx.showModal({
      title: isEdit ? '编辑联系人' : '新增联系人',
      editable: true,
      placeholderText: state.name || '收货人姓名',
      success: (r) => {
        if (!r.confirm) return;
        state.name = r.content || state.name;
        askPhone();
      }
    });
    const askPhone = () => wx.showModal({
      title: '手机号',
      editable: true,
      placeholderText: state.phone || '收货人手机号',
      success: (r) => {
        if (!r.confirm) return;
        state.phone = r.content || state.phone;
        askBuilding();
      }
    });
    const askBuilding = () => wx.showModal({
      title: '楼栋',
      editable: true,
      placeholderText: state.building || '如：3号宿舍楼',
      success: (r) => {
        if (!r.confirm) return;
        state.building = r.content || state.building;
        askRoom();
      }
    });
    const askRoom = () => wx.showModal({
      title: '房间号',
      editable: true,
      placeholderText: state.room || '如：502室',
      success: (r) => {
        if (!r.confirm) return;
        state.room = r.content || state.room;
        submit();
      }
    });
    const submit = async () => {
      if (!state.name || !state.phone || !state.building) {
        wx.showToast({ title: '请完整填写姓名/电话/楼栋', icon: 'none' });
        return;
      }
      try {
        if (isEdit) {
          await app.request({
            url: '/users/addresses/' + state.id,
            method: 'PUT',
            data: state
          });
          wx.showToast({ title: '修改成功', icon: 'success' });
        } else {
          await app.request({
            url: '/users/addresses',
            method: 'POST',
            data: state
          });
          wx.showToast({ title: '添加成功', icon: 'success' });
        }
        this.loadAddresses();
      } catch (err) {}
    };

    askName();
  },

  deleteAddress(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '删除地址', content: '确定删除该地址？',
      success: (res) => {
        if (!res.confirm) return;
        app.request({ url: '/users/addresses/' + id, method: 'DELETE' })
          .then(() => {
            wx.showToast({ title: '已删除', icon: 'success' });
            this.loadAddresses();
          })
          .catch(() => {});
      }
    });
  }
});
