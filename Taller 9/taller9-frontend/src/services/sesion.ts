// Manejo de la sesión en el navegador (ya está listo).
// La sesión (token, id y username) se guarda en localStorage para que
// se mantenga aunque se recargue la página.

export interface Sesion {
  token: string;
  id: number;
  username: string;
}

const CLAVE = "taller9-sesion";

export const guardarSesion = (sesion: Sesion) => {
  localStorage.setItem(CLAVE, JSON.stringify(sesion));
};

export const obtenerSesion = (): Sesion | null => {
  try {
    const texto = localStorage.getItem(CLAVE);
    if (!texto) return null;
    const sesion = JSON.parse(texto);
    return sesion && typeof sesion.token === "string" && sesion.token &&
      Number.isInteger(sesion.id) && typeof sesion.username === "string" ? sesion : null;
  } catch {
    return null;
  }
};

export const cerrarSesion = () => {
  localStorage.removeItem(CLAVE);
};
