
// 测试上传暂停/停止功能
const BASE_URL = 'http://localhost:3000';

async function test() {
  // 1. 先注册并登录
  try {
    console.log('注册用户...');
    await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'testuser',
        email: 'test@test.com',
        password: 'password123',
        confirmPassword: 'password123'
      })
    }).then(r => r.json()).then(d => console.log('注册:', JSON.stringify(d, null, 2)));
  } catch (e) {
    console.log('注册可能失败（用户已存在）:', e.message);
  }

  // 登录
  console.log('\n登录...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'testuser',
      password: 'password123'
    })
  }).then(r => r.json());
  console.log('登录:', JSON.stringify(loginRes, null, 2));

  if (!loginRes.success) {
    console.log('登录失败，退出测试');
    return;
  }

  const token = loginRes.data.token;
  console.log('Token:', token.substring(0, 20) + '...');

  // 2. 创建大文件用于测试（约 5MB 随机数据）
  console.log('\n创建测试文件...');
  const buf = new Uint8Array(5 * 1024 * 1024);
  crypto.getRandomValues(buf);
  const blob = new Blob([buf], { type: 'application/octet-stream' });
  const file = new File([blob], 'test-upload.bin', { type: 'application/octet-stream' });

  // 3. 测试1：上传后暂停
  console.log('\n=== 测试1：上传后暂停 ===');
  
  const formData1 = new FormData();
  formData1.append('files', file);
  
  const controller1 = new AbortController();
  let paused = false;
  
  // 2秒后模拟暂停
  setTimeout(() => {
    console.log('⏸  2秒后中止请求（模拟暂停）');
    paused = true;
    controller1.abort();
  }, 2000);

  try {
    const start = Date.now();
    const res = await fetch(`${BASE_URL}/api/files/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData1,
      signal: controller1.signal
    }).then(r => r.json());
    console.log('上传结果:', JSON.stringify(res, null, 2));
    console.log('耗时:', (Date.now() - start) / 1000, '秒');
  } catch (e) {
    if (e.name === 'AbortError') {
      console.log('✅ 请求被中止（暂停） - 正确行为');
    } else {
      console.log('❌ 错误:', e.message);
    }
  }

  // 4. 测试2：上传后取消（与暂停相同的中止方式）
  console.log('\n=== 测试2：上传后取消 ===');
  
  const formData2 = new FormData();
  formData2.append('files', file);
  
  const controller2 = new AbortController();
  
  setTimeout(() => {
    console.log('⏹  2秒后中止请求（模拟取消）');
    controller2.abort();
  }, 2000);

  try {
    const res = await fetch(`${BASE_URL}/api/files/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData2,
      signal: controller2.signal
    }).then(r => r.json());
    console.log('上传结果:', JSON.stringify(res, null, 2));
  } catch (e) {
    if (e.name === 'AbortError') {
      console.log('✅ 请求被中止（取消） - 正确行为');
    } else {
      console.log('❌ 错误:', e.message);
    }
  }

  // 5. 测试3：正常小文件上传
  console.log('\n=== 测试3：正常上传小文件 ===');
  
  const smallBuf = new Uint8Array(1024);
  crypto.getRandomValues(smallBuf);
  const smallBlob = new Blob([smallBuf], { type: 'text/plain' });
  const smallFile = new File([smallBlob], 'small-file.txt', { type: 'text/plain' });
  
  const formData3 = new FormData();
  formData3.append('files', smallFile);
  
  try {
    const res = await fetch(`${BASE_URL}/api/files/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData3
    }).then(r => r.json());
    console.log('上传结果:', JSON.stringify(res, null, 2));
    if (res.success) {
      console.log('✅ 正常上传成功');
    } else {
      console.log('❌ 上传失败:', res.message);
    }
  } catch (e) {
    console.log('❌ 错误:', e.message);
  }

  console.log('\n=== 测试完成 ===');
}

test().catch(e => console.error('测试失败:', e));
