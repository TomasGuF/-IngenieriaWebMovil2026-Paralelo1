import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import RegistroPage from './RegistroPage';
import { registrarUsuario } from '../services/api';
vi.mock('../services/api', () => ({ registrarUsuario: vi.fn() }));
afterEach(() => { cleanup(); vi.resetAllMocks(); });
const enviar = async () => {
  const { container } = render(<RegistroPage />);
  await waitFor(() => expect(container.querySelector('ion-input')?.classList.contains('hydrated')).toBe(true));
  const inputs = container.querySelectorAll('ion-input');
  await act(async () => {
    fireEvent.input(await inputs[0].getInputElement(), { target: { value: 'nuevo' } });
    fireEvent.input(await inputs[1].getInputElement(), { target: { value: 'password-123' } });
  });
  await act(async () => { fireEvent.submit(container.querySelector('form')!); });
};
test.each([400, 409])('muestra el error %s del registro', async status => {
  vi.mocked(registrarUsuario).mockRejectedValue(Object.assign(new Error(`Error ${status}`), { status }));
  await enviar();
  expect(await screen.findByRole('alert')).toHaveTextContent(`Error ${status}`);
});
test('registra y muestra el enlace de inicio de sesión', async () => {
  vi.mocked(registrarUsuario).mockResolvedValue({ id: 4, username: 'nuevo' });
  await enviar();
  await waitFor(() => expect(registrarUsuario).toHaveBeenCalledWith('nuevo', 'password-123'));
  expect(await screen.findByRole('status')).toHaveTextContent('Cuenta creada');
  expect(screen.getByText('Iniciar sesión').getAttribute('router-link')).toBe('/login');
});
