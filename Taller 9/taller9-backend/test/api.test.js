const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { randomBytes } = require('node:crypto');
const { once } = require('node:events');
const jwt = require('jsonwebtoken');
const net = require('node:net');

test('API: registro, JWT, autoría y cambio de contraseña', async (t) => {
  const listener = net.createServer().listen(0, '127.0.0.1');
  await once(listener, 'listening');
  const port = listener.address().port;
  await new Promise(resolve => listener.close(resolve));
  const secret = randomBytes(32).toString('hex');
  const child = spawn(process.execPath, ['servidor.js'], {
    cwd: require('node:path').resolve(__dirname, '..'),
    env: { ...process.env, PORT: String(port), JWT_SECRET: secret }, stdio: ['ignore', 'pipe', 'pipe']
  });
  t.after(async () => { child.kill(); await once(child, 'exit'); });
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Servidor no inició')), 5000);
    child.stdout.on('data', () => { clearTimeout(timeout); resolve(); });
    child.once('error', reject);
    child.once('exit', code => { clearTimeout(timeout); reject(new Error(`Salida prematura: ${code}`)); });
  });
  const request = async (path, status, method = 'GET', body, token) => {
    const response = await fetch(`http://127.0.0.1:${port}${path}`, {
      method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const data = response.status === 204 ? null : await response.json();
    assert.equal(response.status, status, `${method} ${path}: ${JSON.stringify(data)}`);
    return data;
  };
  await t.test('registro valida entradas y evita duplicados incluso concurrentes', async () => {
    for (const body of [{}, { username: 'x', password: 'short' }, { username: {}, password: '12345678' }, { username: 'x', password: 12345678 }]) {
      await request('/api/usuarios', 400, 'POST', body);
    }
    const created = await request('/api/usuarios', 201, 'POST', { username: 'nuevo', password: 'nuevo-12345' });
    assert.deepEqual(Object.keys(created).sort(), ['id', 'username']);
    await request('/api/usuarios', 409, 'POST', { username: 'nuevo', password: 'nuevo-12345' });
    const responses = await Promise.all([1, 2].map(() => fetch(`http://127.0.0.1:${port}/api/usuarios`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'concurrente', password: 'password-123' }) })));
    assert.deepEqual(responses.map(r => r.status).sort(), [201, 409]);
  });
  await request('/api/login', 400, 'POST', {});
  await request('/api/login', 401, 'POST', { username: 'ana', password: 'incorrecta' });
  await request('/api/login', 401, 'POST', { username: 'inexistente', password: 'incorrecta' });
  const ana = await request('/api/login', 200, 'POST', { username: 'ana', password: 'ana-12345' });
  const carla = await request('/api/login', 200, 'POST', { username: 'carla', password: 'carla-12345' });
  await request('/api/login', 200, 'POST', { username: 'benjamin', password: 'benjamin-12345' });
  assert.equal(jwt.verify(ana.token, secret).id, 1);
  assert.equal(jwt.decode(ana.token).passwordHash, undefined);
  await t.test('perfil y errores de autenticación', async () => {
    assert.deepEqual(await request('/api/usuarios/yo', 200, 'GET', undefined, ana.token), { id: 1, username: 'ana' });
    await request('/api/usuarios/yo', 401);
    await request('/api/usuarios/yo', 401, 'GET', undefined, ana.token + 'x');
    const expired = jwt.sign({ id: 1 }, secret, { expiresIn: -1 });
    assert.equal((await request('/api/usuarios/yo', 401, 'GET', undefined, expired)).error, 'Token expirado');
    await request('/api/usuarios/yo', 401, 'GET', undefined, jwt.sign({ id: 1 }, 'otra-clave'));
  });
  await t.test('lecturas públicas y escrituras solo del autor', async () => {
    assert.equal((await request('/api/posts', 200)).length, 5);
    assert.equal((await request('/api/posts?userId=2', 200)).length, 2);
    for (const [method, path] of [['POST','/api/posts'], ['PUT','/api/posts/1'], ['DELETE','/api/posts/1']]) await request(path, 401, method, {});
    const post = await request('/api/posts', 201, 'POST', { title: 'Prueba', body: 'Contenido', userId: 3 }, ana.token);
    assert.equal(post.userId, 1);
    const edited = await request(`/api/posts/${post.id}`, 200, 'PUT', { title: 'Editado', body: 'Contenido', userId: 3 }, ana.token);
    assert.equal(edited.userId, 1);
    await request('/api/posts/5', 403, 'PUT', { title: 'Ajeno', body: 'Contenido' }, ana.token);
    await request('/api/posts/5', 403, 'DELETE', undefined, ana.token);
    await request('/api/posts/5', 204, 'DELETE', undefined, carla.token);
    await request('/api/posts/5', 404);
    await request('/api/posts', 400, 'POST', {}, ana.token);
  });
  await t.test('cambio protegido de contraseña y nuevo login', async () => {
    const path = '/api/usuarios/yo/password';
    await request(path, 401, 'PUT', {});
    await request(path, 400, 'PUT', { passwordActual: 'ana-12345', passwordNueva: 'corta' }, ana.token);
    await request(path, 401, 'PUT', { passwordActual: 'incorrecta', passwordNueva: 'nueva-12345' }, ana.token);
    await request(path, 204, 'PUT', { passwordActual: 'ana-12345', passwordNueva: 'nueva-12345' }, ana.token);
    await request('/api/login', 401, 'POST', { username: 'ana', password: 'ana-12345' });
    await request('/api/login', 200, 'POST', { username: 'ana', password: 'nueva-12345' });
  });
});

test('el servidor exige JWT_SECRET', () => {
  const env = { ...process.env }; delete env.JWT_SECRET;
  const result = require('node:child_process').spawnSync(process.execPath, ['servidor.js'], { cwd: require('node:path').resolve(__dirname, '..'), env, encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Falta la variable/);
});
