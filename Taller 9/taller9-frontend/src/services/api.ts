// Taller 9: completa los pasos 8 y 9 de este archivo.
// El resto de la aplicación ya está listo y utiliza estas funciones.

import { obtenerSesion } from "./sesion";
import type { Sesion } from "./sesion";

export interface Publicacion {
  userId: number;
  id: number;
  title: string;
  body: string;
}

// Ya no enviamos userId: el servidor lo toma del token.
export interface DatosPublicacion {
  title: string;
  body: string;
}

// Dirección del servidor Express.
export const API_URL = "http://localhost:3000";

// Error con el código de estado de la respuesta, para que la página
// pueda reaccionar distinto ante un 401 (por ejemplo, volver al login).
export class ErrorApi extends Error {
  status: number;

  constructor(mensaje: string, status: number) {
    super(mensaje);
    this.status = status;
  }
}

// Revisa la respuesta del servidor (ya está lista, igual que en el Taller 8).
const procesarRespuesta = async (response: Response) => {
  if (response.status === 204) {
    return null;
  }
  const texto = await response.text();
  let datos;
  try {
    datos = JSON.parse(texto);
  } catch {
    datos = null;
  }
  if (!response.ok) {
    throw new ErrorApi(datos?.error ?? `El servidor respondió con el código ${response.status}`, response.status);
  }
  return datos;
};

// 8: POST /api/login
// Envía username y password, y devuelve la respuesta del servidor ({ token, id, username }).
// Pista: es muy parecida a crearPublicacion.
export const iniciarSesion = async (username: string, password: string): Promise<Sesion> => {
  throw new Error("Paso 8 pendiente: completa iniciarSesion en src/services/api.ts");
};

// 9: Agrega el header Authorization con el token de la sesión.
// El formato es: Authorization: Bearer <token>
export const encabezadosConToken = (): Record<string, string> => {
  const sesion = obtenerSesion();
  const encabezados: Record<string, string> = {};
  // Si hay una sesión, agrega aquí el header Authorization.
  return encabezados;
};

// GET /api/usuarios/yo (ruta protegida)
export const obtenerPerfil = async (): Promise<{ id: number; username: string }> => {
  const response = await fetch(`${API_URL}/api/usuarios/yo`, { headers: encabezadosConToken() });
  return procesarRespuesta(response);
};

// GET /api/posts (ruta pública)
export const obtenerPublicaciones = async (userId?: number): Promise<Publicacion[]> => {
  const url = userId ? `${API_URL}/api/posts?userId=${userId}` : `${API_URL}/api/posts`;
  const response = await fetch(url);
  return procesarRespuesta(response);
};

// POST /api/posts (ruta protegida)
export const crearPublicacion = async (datos: DatosPublicacion): Promise<Publicacion> => {
  const response = await fetch(`${API_URL}/api/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...encabezadosConToken() },
    body: JSON.stringify(datos)
  });
  return procesarRespuesta(response);
};

// PUT /api/posts/:id (ruta protegida)
export const actualizarPublicacion = async (id: number, datos: DatosPublicacion): Promise<Publicacion> => {
  const response = await fetch(`${API_URL}/api/posts/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...encabezadosConToken() },
    body: JSON.stringify(datos)
  });
  return procesarRespuesta(response);
};

// DELETE /api/posts/:id (ruta protegida)
export const eliminarPublicacion = async (id: number): Promise<void> => {
  const response = await fetch(`${API_URL}/api/posts/${id}`, {
    method: "DELETE",
    headers: encabezadosConToken()
  });
  await procesarRespuesta(response);
};
