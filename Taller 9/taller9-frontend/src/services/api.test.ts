import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { ErrorApi, encabezadosConToken, iniciarSesion, registrarUsuario, obtenerPerfil } from './api';
import { cerrarSesion, guardarSesion } from './sesion';

beforeEach(() => { cerrarSesion(); vi.stubGlobal('fetch', vi.fn()); });
afterEach(() => vi.unstubAllGlobals());

test('login envía credenciales y devuelve la sesión', async () => {
  const sesion = { token: 'jwt-prueba', id: 1, username: 'ana' };
  vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(sesion)));
  expect(await iniciarSesion('ana', 'ana-12345')).toEqual(sesion);
  expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/login'), expect.objectContaining({ method: 'POST', body: JSON.stringify({ username: 'ana', password: 'ana-12345' }) }));
});

test('perfil envía Bearer de la sesión guardada', async () => {
  expect(encabezadosConToken()).toEqual({});
  guardarSesion({ token: 'jwt-prueba', id: 1, username: 'ana' });
  vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ id: 1, username: 'ana' })));
  await obtenerPerfil();
  expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/usuarios/yo'), { headers: { Authorization: 'Bearer jwt-prueba' } });
});

test.each([400, 409])('registro conserva mensaje y estado %s del servidor', async (status) => {
  vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ error: 'Mensaje del servidor' }), { status }));
  await expect(registrarUsuario('ana', 'corta')).rejects.toMatchObject({ message: 'Mensaje del servidor', status });
});

test('un token expirado conserva el 401 para cerrar la sesión', async () => {
  vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ error: 'Token expirado' }), { status: 401 }));
  await expect(obtenerPerfil()).rejects.toBeInstanceOf(ErrorApi);
});
