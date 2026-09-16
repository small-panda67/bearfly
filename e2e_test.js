const http = require('http');

function post(path, body, token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api' + path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };
    if (token) options.headers.Authorization = 'Bearer ' + token;
    const req = http.request(options, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch(e) { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api' + path,
      method: 'GET',
      headers: token ? { Authorization: 'Bearer ' + token } : {}
    };
    const req = http.request(options, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch(e) { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function put(path, body, token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api' + path,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };
    if (token) options.headers.Authorization = 'Bearer ' + token;
    const req = http.request(options, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch(e) { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  // 1. User login
  console.log('=== 1. User Login ===');
  const login = await post('/auth/phone-login', { phone: '13900004444', code: '123456' });
  console.log('Status:', login.status, JSON.stringify(login.body).substring(0, 200));
  if (login.status !== 200) { console.log('LOGIN FAILED'); return; }
  const userToken = login.body.data.token;
  const userId = login.body.data.userInfo.id;
  console.log('User ID:', userId);

  // 2. Create order
  console.log('\n=== 2. Create Order ===');
  const order = await post('/orders', {
    type: 'express', campus: '主校区', pickup_address: '菜鸟驿站',
    delivery_address: '3号楼502', pickup_name: '用户', delivery_name: '用户',
    pickup_phone: '13900004444', delivery_phone: '13900004444',
    amount: 5, tip: 1, insurance: 0, remark: '测试订单',
    item_desc: '快递', item_size: 'small'
  }, userToken);
  console.log('Status:', order.status, JSON.stringify(order.body).substring(0, 300));
  if (order.status !== 200) { console.log('ORDER CREATE FAILED'); return; }
  const orderId = order.body.data.id;
  console.log('Order ID:', orderId);

  // 3. Admin login
  console.log('\n=== 3. Admin Login ===');
  const adminLogin = await post('/auth/admin-login', { username: 'admin', password: 'admin123' });
  console.log('Status:', adminLogin.status, adminLogin.body.message);
  const adminToken = adminLogin.body.data.token;

  // 4. Create rider via direct DB simulation - first apply as rider user
  console.log('\n=== 4. Rider Apply ===');
  const riderLogin = await post('/auth/phone-login', { phone: '13900005555', code: '123456' });
  const riderToken = riderLogin.body.data.token;
  const riderUserId = riderLogin.body.data.userInfo.id;
  console.log('Rider User ID:', riderUserId);

  const apply = await post('/riders/apply', {
    name: '测试跑腿员', phone: '13900005555', id_card: '500101199001011234',
    campus: '主校区', student_id: '2024001'
  }, riderToken);
  console.log('Apply status:', apply.status, apply.body.message);

  // 5. Admin approves rider - need to find the application ID
  console.log('\n=== 5. Admin Approve Rider ===');
  const apps = await get('/admin/rider-applications', adminToken);
  console.log('Applications count:', apps.body.data ? apps.body.data.length : 0);
  if (apps.body.data && apps.body.data.length > 0) {
    const appId = apps.body.data[0].id;
    const audit = await put(`/admin/rider-applications/${appId}/audit`, { status: 'approved', reason: '审核通过' }, adminToken);
    // PUT request
    console.log('Audit status:', audit.status, audit.body.message);
  }

  // Re-login rider to get updated role
  const riderLogin2 = await post('/auth/phone-login', { phone: '13900005555', code: '123456' });
  const riderToken2 = riderLogin2.body.data.token;
  console.log('Rider role after approval:', riderLogin2.body.data.userInfo.role);

  // 6. Rider grabs order
  console.log('\n=== 6. Rider Grab Order ===');
  const grab = await post(`/riders/grab/${orderId}`, {}, riderToken2);
  console.log('Grab status:', grab.status, grab.body.message);

  // 7. Rider pickup
  console.log('\n=== 7. Rider Confirm Pickup ===');
  const pickup = await post(`/riders/orders/${orderId}/pickup`, {}, riderToken2);
  console.log('Pickup status:', pickup.status, pickup.body.message);

  // 8. Rider deliver
  console.log('\n=== 8. Rider Confirm Deliver ===');
  const deliver = await post(`/riders/orders/${orderId}/deliver`, {}, riderToken2);
  console.log('Deliver status:', deliver.status, JSON.stringify(deliver.body).substring(0, 200));

  // 9. User confirm receipt
  console.log('\n=== 9. User Confirm Receipt ===');
  const confirm = await post(`/orders/${orderId}/confirm`, {}, userToken);
  console.log('Confirm status:', confirm.status, confirm.body.message);

  // 10. User rate
  console.log('\n=== 10. User Rate Order ===');
  const rate = await post(`/orders/${orderId}/rate`, { rating: 5, content: '服务很好，速度快' }, userToken);
  console.log('Rate status:', rate.status, rate.body.message);

  // 11. Check order detail with tracks
  console.log('\n=== 11. Order Detail with Tracks ===');
  const detail = await get(`/orders/${orderId}`, userToken);
  console.log('Status:', detail.body.data ? detail.body.data.status : 'N/A');
  console.log('Tracks count:', detail.body.data.tracks ? detail.body.data.tracks.length : 0);
  if (detail.body.data.tracks) {
    detail.body.data.tracks.forEach(t => console.log('  -', t.description));
  }

  // 12. Check rider income
  console.log('\n=== 12. Rider Income ===');
  const income = await get('/riders/income', riderToken2);
  console.log(JSON.stringify(income.body.data));

  console.log('\n=== E2E TEST COMPLETE ===');
}

main().catch(console.error);
