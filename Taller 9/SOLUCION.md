# Solución del Taller 9

Implementados los pasos 1–10 y ambos desafíos. Todos los cambios se limitan a este taller.

## Ejecución

Requiere Node 20.19+ o 22.12+ (validado con Node 24) para Vite 8.

En `taller9-backend`, ejecutar `npm ci --ignore-scripts`, crear `.env` desde `.env.example` y reemplazar `JWT_SECRET` por una clave aleatoria local. No versionar `.env`. `JWT_EXPIRA=1h` controla la duración de los tokens. Ejecutar `npm run dev` o `npm start`; puerto 3000 por defecto, configurable con `PORT`.

En `taller9-frontend`, ejecutar `npm ci --ignore-scripts` y `npm run dev -- --port 8100`. La API usa `http://localhost:3000`. No requiere Ionic CLI.

## Comportamiento

- Registro público `POST /api/usuarios`: `{username,password}`; devuelve 201, 400 para entradas inválidas y 409 para duplicados. Las contraseñas requieren al menos 8 caracteres y hasta 72 bytes (límite de bcrypt).
- Login `POST /api/login`: devuelve `{token,id,username}`; nunca expone el hash.
- Perfil protegido `GET /api/usuarios/yo`; JWT faltante, inválido o expirado devuelve 401.
- Lecturas de publicaciones públicas; creación con autor obtenido del token; edición y eliminación requieren autoría (403 para publicaciones ajenas). El autor no puede cambiarse desde el body.
- `/publicaciones` requiere sesión; el frontend envía Bearer y cierra la sesión ante 401. `/registro` muestra errores del servidor y confirma el registro; enlace desde login y regreso a login al terminar.
- Desafío de contraseña: `PUT /api/usuarios/yo/password` con Bearer y `{passwordActual,passwordNueva}`. Devuelve 204 al cambiar, 400 para entradas inválidas, 401 si la actual no coincide y 404 si el usuario ya no existe. El login anterior deja de funcionar y el nuevo funciona. La ruta está implementada en la API; el desafío no exige una pantalla de cambio.

## Validación

Desde `taller9-backend`: `npm test`. Arranca un servidor aislado con clave efímera y puerto disponible; prueba registro y concurrencia, los tres usuarios iniciales, login, perfil, firma/expiración JWT, autoría, CRUD y cambio de contraseña. También verifica que el servidor rechace iniciar sin clave.

Desde `taller9-frontend`: `npm run test.unit -- --run`, `npm run build`, `npm run lint`. Las pruebas cubren servicio HTTP, Bearer, errores 400/409/401, guardia de rutas y formulario de registro.

## Límites del taller

Datos en memoria: usuarios, publicaciones y cambios de contraseña se pierden al reiniciar. Cerrar sesión o cambiar contraseña no revoca tokens ya emitidos: siguen válidos hasta expirar, como en el modelo del README. Sesión en localStorage. No se agregan persistencia, refresh tokens ni limitación de intentos. Las pruebas de interfaz usan jsdom; no sustituyen una prueba de navegador real. El build advierte sobre tamaño de bundles y las pruebas originales sobre React Router/act.
