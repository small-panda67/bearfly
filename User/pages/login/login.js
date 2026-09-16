// pages/login/login.js
const app = getApp();

Page({
  data: {
    loginMode: 'student', // student / admin
    step: 1, // 学生登录步骤：1=姓名学号，2=手机号绑定
    // 学生登录
    name: '',
    studentNo: '',
    tempToken: '',
    studentInfo: {},
    // 手机号验证
    phone: '',
    code: '',
    countdown: 0,
    timer: null,
    // 管理员登录
    adminUsername: '',
    adminPassword: '',
    // 通用
    agreed: false,
    logging: false
  },

  onUnload() {
    if (this.data.timer) clearInterval(this.data.timer);
  },

  // ===== 学生登录 - 第一步 =====
  onNameInput(e) {
    this.setData({ name: e.detail.value });
  },

  onStudentNoInput(e) {
    this.setData({ studentNo: e.detail.value });
  },

  async studentLogin() {
    if (!this.data.agreed) {
      wx.showToast({ title: '请先同意用户协议', icon: 'none' });
      return;
    }
    if (!this.data.name.trim()) {
      wx.showToast({ title: '请输入姓名', icon: 'none' });
      return;
    }
    if (!this.data.studentNo.trim()) {
      wx.showToast({ title: '请输入学号', icon: 'none' });
      return;
    }

    this.setData({ logging: true });
    try {
      const res = await app.request({
        url: '/auth/student-login',
        method: 'POST',
        data: { name: this.data.name.trim(), studentNo: this.data.studentNo.trim() }
      });
      if (res.needBindPhone) {
        // 需要手机号绑定验证
        this.setData({
          step: 2,
          tempToken: res.tempToken,
          studentInfo: res.studentInfo,
          phone: res.studentInfo.phone || ''
        });
        wx.showToast({ title: '验证通过，请绑定手机号', icon: 'success' });
      } else {
        // 已绑定，直接登录成功
        this.saveLoginInfo(res.token, res.userInfo);
      }
    } catch (err) {
      // 错误提示由 request 封装统一处理
    } finally {
      this.setData({ logging: false });
    }
  },

  // ===== 学生登录 - 第二步：手机号绑定 =====
  onPhoneInput(e) {
    this.setData({ phone: e.detail.value });
  },

  onCodeInput(e) {
    this.setData({ code: e.detail.value });
  },

  async sendCode() {
    if (this.data.countdown > 0) return;
    if (!/^1\d{10}$/.test(this.data.phone)) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
      return;
    }
    try {
      await app.request({
        url: '/auth/send-code',
        method: 'POST',
        data: { phone: this.data.phone }
      });
      wx.showToast({ title: '验证码已发送', icon: 'success' });
    } catch (err) {
      wx.showToast({ title: '验证码已发送(测试:123456)', icon: 'none' });
    }
    this.setData({ countdown: 60 });
    const timer = setInterval(() => {
      if (this.data.countdown <= 1) {
        clearInterval(timer);
        this.setData({ countdown: 0, timer: null });
      } else {
        this.setData({ countdown: this.data.countdown - 1 });
      }
    }, 1000);
    this.setData({ timer });
  },

  async bindPhone() {
    if (!/^1\d{10}$/.test(this.data.phone)) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
      return;
    }
    if (this.data.code.length < 4) {
      wx.showToast({ title: '请输入验证码', icon: 'none' });
      return;
    }

    this.setData({ logging: true });
    try {
      const res = await app.request({
        url: '/auth/bind-phone',
        method: 'POST',
        data: {
          tempToken: this.data.tempToken,
          phone: this.data.phone,
          code: this.data.code
        }
      });
      this.saveLoginInfo(res.token, res.userInfo);
    } catch (err) {
      // 错误提示由 request 封装统一处理
    } finally {
      this.setData({ logging: false });
    }
  },

  backToStep1() {
    this.setData({
      step: 1,
      tempToken: '',
      studentInfo: {},
      phone: '',
      code: ''
    });
  },

  // ===== 管理员登录 =====
  onAdminUsernameInput(e) {
    this.setData({ adminUsername: e.detail.value });
  },

  onAdminPasswordInput(e) {
    this.setData({ adminPassword: e.detail.value });
  },

  async adminLogin() {
    if (!this.data.agreed) {
      wx.showToast({ title: '请先同意用户协议', icon: 'none' });
      return;
    }
    if (!this.data.adminUsername.trim()) {
      wx.showToast({ title: '请输入管理员账号', icon: 'none' });
      return;
    }
    if (!this.data.adminPassword) {
      wx.showToast({ title: '请输入密码', icon: 'none' });
      return;
    }

    this.setData({ logging: true });
    try {
      const res = await app.request({
        url: '/auth/admin-login',
        method: 'POST',
        data: {
          username: this.data.adminUsername.trim(),
          password: this.data.adminPassword
        }
      });
      // 保存管理员登录态
      app.globalData.token = res.token;
      app.globalData.userInfo = res.adminInfo;
      app.globalData.role = 'admin';
      wx.setStorageSync('token', res.token);
      wx.setStorageSync('userInfo', res.adminInfo);
      wx.setStorageSync('role', 'admin');

      this.setData({ logging: false });
      wx.showToast({ title: '登录成功', icon: 'success' });
      setTimeout(() => {
        // 管理员直接进入移动端管理后台
        wx.redirectTo({ url: '/pages/admin-mobile/admin-mobile' });
      }, 1000);
    } catch (err) {
      this.setData({ logging: false });
    }
  },

  switchToAdmin() {
    this.setData({ loginMode: 'admin' });
  },

  switchToStudent() {
    this.setData({ loginMode: 'student', step: 1 });
  },

  // ===== 通用 =====
  saveLoginInfo(token, userInfo) {
    app.globalData.token = token;
    app.globalData.userInfo = userInfo;
    app.globalData.role = userInfo.role || 'user';
    wx.setStorageSync('token', token);
    wx.setStorageSync('userInfo', userInfo);
    wx.setStorageSync('role', userInfo.role || 'user');

    this.setData({ logging: false });
    wx.showToast({ title: '登录成功', icon: 'success' });
    setTimeout(() => {
      wx.switchTab({ url: '/pages/index/index' });
    }, 1000);
  },

  toggleAgree() {
    this.setData({ agreed: !this.data.agreed });
  },

  showAgreement() {
    wx.showModal({ title: '用户协议', content: '用户协议内容...', showCancel: false });
  },

  showPrivacy() {
    wx.showModal({ title: '隐私政策', content: '隐私政策内容...', showCancel: false });
  }
});
