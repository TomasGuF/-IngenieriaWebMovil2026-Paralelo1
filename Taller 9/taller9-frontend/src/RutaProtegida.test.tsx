import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, expect, test } from 'vitest';
import { RutaProtegida } from './App';
import { cerrarSesion, guardarSesion } from './services/sesion';
afterEach(() => { cleanup(); cerrarSesion(); });
const abrir = () => render(<MemoryRouter initialEntries={['/publicaciones']}><Routes>
  <Route path="/publicaciones" element={<RutaProtegida><p>Contenido privado</p></RutaProtegida>} />
  <Route path="/login" element={<p>Acceso requerido</p>} />
</Routes></MemoryRouter>);
test('sin sesión redirige al login', () => {
  cerrarSesion(); abrir();
  expect(screen.getByText('Acceso requerido')).toBeDefined();
  expect(screen.queryByText('Contenido privado')).toBeNull();
});
test('con sesión muestra el contenido protegido', () => {
  guardarSesion({ token: 'jwt-prueba', id: 1, username: 'ana' }); abrir();
  expect(screen.getByText('Contenido privado')).toBeDefined();
});
