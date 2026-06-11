
const http = require('http');
const crypto = require('crypto');

const BASE_URL = 'localhost';
const PORT = 3000;

function postRequest(path, body, token, abortFn) {
  return new Promise((resolve, reject) => {
    const contentType = typeof body === 'string' ? 'application/json' : 'multipart/form-data; boundary=' + body.boundary;
    
    const options = {
      hostname: BASE_URL,
      port: PORT,
      path: '/api' + path,
      method: 'POST',
      headers: {
        'Content-Type': contentType
      }
    };
    
    if (token) {
      options.headers['Authorization'] = 'Bearer ' + token;
    }
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    
    req.on('error', (e) => {
      if (abortFn && (e.message.includes('aborted') || e.message.includes('destroy'))) {
        reject({ name: 'AbortError', message: e.message });
      } else {
        reject(e);
      }
    });
    
    if (typeof body === 'string') {
      req.write(body);
      req.end();
    } else {
      req.write(body.data);
      req.end();
    }
    
    if (abortFn) {
      abortFn(() => {
        req.destroy(new Error('aborted'));
      });
    }
  });
}

function createFormData(fileName, fileContent) {
  const boundary = '----WebKitFormBoundary' + Math.random().toString(16).slice(2);
  let body = '';
  
  body += '--' + boundary + '\r\n';
  body += `Content-Disposition: form-data; name="files"; filename="${fileName}"\r\n`;
  body += 'Content-Type: application/octet-stream\r\n';
  body += '\r\n';
  
  const headerBuffer = Buffer.from(body, 'utf8');
  const fileBuffer = Buffer.from(fileContent);
  const footerBuffer = Buffer.from('\r\n--' + boundary + '--\r\n', 'utf8');
  
  return {
    boundary,
    data: Buffer.concat([headerBuffer, fileBuffer, footerBuffer])
  };
}

async function test() {
  let token = null;

  console.log('1. 注册用户...');
  try {
    const reg = await postRequest('/auth/register', JSON.stringify({
      username: 'testuser',
      email: 'test@test.com',
      password: 'password123',
      confirmPassword: 'password123'
    }));
    console.log('   注册结果:', JSON.stringify(reg.body));
  } catch (e) {
    console.log('   注册:', e.message);
  }

  console.log('\n2. 登录...');
  const login = await postRequest('/auth/login', JSON.stringify({
    username: 'testuser',
    password: 'password123'
  }));
  console.log('   登录结果:', JSON.stringify(login.body));
  
  if (login.body && login.body.success && login.body.data) {
    token = login.body.data.token;
    console.log('   Token:', token.substring(0, 20) + '...');
  } else {
    console.log('   登录失败，退出测试');
    return;
  }

  console.log('\n3. 创建测试文件 (5MB)...');
  const fileData = crypto.randomBytes(5 * 1024 * 1024);
  console.log('   文件大小:', fileData.length, '字节');

  console.log('\n=== 测试1：正常上传小文件 ===');
  const smallData = crypto.randomBytes(10 * 1024);
  const formData1 = createFormData('small-test.txt', smallData);
  try {
    const result = await postRequest('/files/upload', formData1, token);
    console.log('   状态码:', result.status);
    if (result.body && result.body.success) {
      console.log('   ✅ 正常上传成功');
    } else {
      console.log('   ⚠️  上传结果:', JSON.stringify(result.body));
    }
  } catch (e) {
    console.log('   ❌ 上传失败:', e.message);
  }

  console.log('\n=== 测试2：上传大文件并中止（模拟暂停/停止）===');
  const formData2 = createFormData('large-test.bin', fileData);
  
  let abortCallback = null;
  setTimeout(() => {
    console.log('   ⏸  200ms 后中止请求');
    if (abortCallback) abortCallback();
  }, 200);
  
  try {
    await postRequest('/files/upload', formData2, token, (fn) => { abortCallback = fn; });
    console.log('   ❌ 请求完成（应该被中止才对）');
  } catch (e) {
    if (e.name === 'AbortError' || e.message.includes('aborted')) {
      console.log('   ✅ 请求被中止 - 正确行为');
      console.log('   从后端角度看：连接已断开，multer 应该已清理临时文件');
    } else {
      console.log('   ❌ 其他错误:', e.message);
    }
  }

  console.log('\n=== 测试完成 ===');
  console.log('\n后端行为预期:');
  console.log('  - 收到中止请求时: multer 自动清理临时文件');
  console.log('  - 不产生数据库记录（因为在完成前中断）');
  console.log('\n前端行为预期:');
  console.log('  - 暂停: 保留在队列中，显示"已暂停"，不标记为失败');
  console.log('  - 停止: 显示"已取消"，加入失败列表');
}

test().catch(e => console.error('测试异常:', e));
