# Taller 9: Autenticación, autorización y JWT

**Nota**: Durante todos nuestros talleres utilizaremos el editor de código Visual Studio Code. Para dudas respecto a la interfaz del editor puedes consultar la documentación oficial en: https://code.visualstudio.com/docs/editing/getting-started

## Algunos comandos útiles para VSCode
```text
Nota: Los siguientes comandos fueron probados en Windows.

Alt + Shift + F - comando para indentar el código.
Control + J - comando para abrir o cerrar la terminal.
Control + S - comando para guardar el archivo actual.
Control + C - (dentro de la terminal) detiene el servidor que se está ejecutando.
F12 - (en el navegador) abre las herramientas de desarrollo y la consola.
```

## Objetivo del Taller 9

Proteger nuestra API y nuestra aplicación: que solo los usuarios **identificados** puedan crear publicaciones, y que solo el **autor** de una publicación pueda editarla o eliminarla.

En este taller trabajaremos con:

- La diferencia entre **autenticación** y **autorización**, y los códigos `401` y `403`.
- Variables de entorno con un archivo `.env`.
- Contraseñas guardadas como **hash** con `bcryptjs`.
- Tokens **JWT** (JSON Web Token) con `jsonwebtoken`.
- Un middleware que protege endpoints específicos.
- Rutas protegidas en la aplicación Ionic.

## ¿Qué cambia respecto al taller anterior?

En el Taller 8 nuestra API permitía crear, editar y eliminar publicaciones, pero tiene un problema grave: **no sabe quién hace cada petición**. Cualquier persona puede eliminar cualquier publicación, o crear una a nombre de otro usuario simplemente enviando otro `userId` en el body.

En este taller, el servidor entregará un **token** a cada usuario que inicie sesión, y lo exigirá para las operaciones que modifican datos.

```text
Taller 8:   DELETE /api/posts/5                         → 204 (cualquiera puede eliminar)
Taller 9:   DELETE /api/posts/5                         → 401 (¿quién eres?)
            DELETE /api/posts/5 + token de ana          → 403 (no es tu publicación)
            DELETE /api/posts/5 + token de carla        → 204 (carla es la autora)
```

## 1. Archivos del taller

Descarga la carpeta del Taller 9. Contiene dos proyectos:

```text
Taller 9/
├── Taller9.postman_collection.json  → peticiones para probar la API en Postman
├── taller9-backend/                 → el servidor del Taller 8 (ya completo)
│   ├── .env.example                 → plantilla de las variables de entorno
│   ├── datos/
│   │   └── usuarios.js              → usuarios de prueba (ya está listo)
│   ├── middleware/
│   │   └── auth.js                  → paso 5
│   ├── routes/
│   │   ├── login.js                 → paso 4
│   │   ├── posts.js                 → paso 7
│   │   └── usuarios.js              → pasos 3 y 5
│   ├── package.json
│   └── servidor.js                  → pasos 1, 3, 4 y 6
└── taller9-frontend/                → la aplicación Ionic + React
    └── src/
        ├── pages/
        │   ├── LoginPage.tsx        → página de inicio de sesión (ya está lista)
        │   └── PublicacionesPage.tsx → la página del Taller 8, adaptada (ya está lista)
        ├── services/
        │   ├── api.ts               → pasos 8 y 9
        │   └── sesion.ts            → guarda la sesión en el navegador (ya está listo)
        └── App.tsx                  → paso 10
```

Importa `Taller9.postman_collection.json` en Postman (botón **Import**).

Los usuarios de prueba son:

| Usuario | Contraseña | `id` |
|---|---|---|
| `ana` | `ana-12345` | 1 |
| `benjamin` | `benjamin-12345` | 2 |
| `carla` | `carla-12345` | 3 |

Cada `id` coincide con el `userId` de las publicaciones que ya existen: las publicaciones 1 y 2 son de `ana`, la 3 y la 4 de `benjamin`, y la 5 de `carla`.

## 2. Levantar los proyectos

Como en los talleres anteriores, utilizaremos dos terminales.

**Terminal 1 (backend):**

```bash
npm config set ignore-scripts true
Explicación: Bloqueamos la ejecución automática de scripts por motivos de seguridad.

cd taller9-backend
npm install
npm run dev
Explicación: Instala las dependencias y levanta el servidor en http://localhost:3000.
```

**Terminal 2 (frontend):**

```bash
cd taller9-frontend
npm install
ionic serve
Explicación: Instala las dependencias y abre la aplicación en http://localhost:8100.
Recuerda ignorar la sugerencia de actualizaciones para las versiones de las dependencias.
```

***Nota 1:*** El frontend utiliza Ionic 9, React 19 y React Router 6. **No actualices `react-router-dom` a la versión 7**: Ionic 9 requiere la versión 6.

***Nota 2:*** Si el comando `ionic` no es reconocido, instala la interfaz de línea de comandos de Ionic: `npm install -g @ionic/cli`.

## 3. Autenticación y autorización

Antes de comenzar, comprueba el problema. Desde Postman, envía la petición **Eliminar publicación ajena**: el servidor elimina la publicación 5 sin preguntar quién eres. Luego detén el servidor (Ctrl+C) y vuelve a levantarlo para recuperar los datos.

Para resolverlo necesitamos dos cosas distintas:

| | Pregunta | Si falla, el servidor responde |
|---|---|---|
| **Autenticación** | ¿Quién eres? | `401 Unauthorized` |
| **Autorización** | ¿Qué puedes hacer? | `403 Forbidden` |

```text
401 → el servidor no sabe quién eres (no enviaste un token, o no es válido).
403 → el servidor sabe quién eres, pero no tienes permiso (por ejemplo, no eres el autor).
```

> El nombre `401 Unauthorized` es confuso: aunque dice "no autorizado", se utiliza cuando falla la **autenticación**.

La autenticación funcionará con **tokens**:

```text
1. El usuario envía su usuario y contraseña      → POST /api/login
2. El servidor verifica y responde con un token  ← { "token": "eyJhbGciOi..." }
3. El cliente guarda el token y lo envía en cada petición protegida:
   Authorization: Bearer eyJhbGciOi...
4. El servidor verifica el token y sabe quién hace la petición.
```

---
# Parte 1: Proteger la API (backend)

## 4. Variables de entorno (Paso 1)

Para firmar los tokens, el servidor necesita una **clave secreta**. Una clave secreta **nunca** debe escribirse en el código, porque el código se sube a GitHub. En su lugar, se guarda en una **variable de entorno**, en un archivo `.env` que no se sube al repositorio.

En la carpeta `taller9-backend`, copia el archivo `.env.example` con el nombre `.env`. Luego genera una clave aleatoria:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
Explicación: Genera 32 bytes aleatorios y los muestra en formato hexadecimal.
```

Copia el resultado en `.env`:

```text
JWT_SECRET=pega-aquí-la-clave-generada
JWT_EXPIRA=1h
```

Revisa el archivo `.gitignore`: ya incluye `.env`, por lo que Git lo ignorará.

Para que Node lea el archivo `.env`, modifica los scripts de `package.json`:

```json
"scripts": {
  "start": "node --env-file=.env servidor.js",
  "dev": "node --env-file=.env --watch servidor.js"
},
```

Finalmente, en el paso 1 de `servidor.js` (al inicio del archivo), agrega:

```javascript
if (!process.env.JWT_SECRET) {
  console.error("Falta la variable de entorno JWT_SECRET. Revisa el archivo .env");
  process.exit(1);
}
```

**Explicación del fragmento de código anterior:**

```text
--env-file=.env              → Node carga las variables del archivo .env (disponible desde Node 20.6).
process.env.JWT_SECRET       → así se lee una variable de entorno en Node.
process.exit(1)              → detiene el servidor: sin clave secreta no puede funcionar.
```

Detén el servidor (Ctrl+C) y vuelve a levantarlo con `npm run dev`.

***Nota 1:*** Si aparece el error `node: .env: not found`, el archivo `.env` no existe o no está en la carpeta `taller9-backend`.

***Nota 2:*** Con `--watch`, el servidor también se reinicia automáticamente cada vez que guardas el archivo `.env`.

## 5. Contraseñas con hash (Paso 2)

Abre el archivo `datos/usuarios.js`. Los usuarios **no** tienen su contraseña, sino un `passwordHash`:

```javascript
{ id: 1, username: "ana", passwordHash: "$2b$10$EmhODdvgvjIty2STWwKtOe..." }
```

Un **hash** es el resultado de aplicar una función matemática **de un solo sentido**: a partir de la contraseña se obtiene el hash, pero a partir del hash **no** se puede obtener la contraseña. Así, si alguien roba los datos del servidor, no obtiene las contraseñas.

Para trabajar con hashes utilizaremos `bcryptjs`. Detén el servidor (Ctrl+C) e instálalo:

```bash
npm view bcryptjs
npm install bcryptjs
```

Realiza el siguiente experimento en la terminal. Escribe `node` para abrir la consola de Node y luego:

```javascript
const bcrypt = require("bcryptjs");
bcrypt.hashSync("ana-12345", 10);
bcrypt.hashSync("ana-12345", 10);
bcrypt.compareSync("ana-12345", "$2b$10$EmhODdvgvjIty2STWwKtOeXjCoHoVwOm20Fao8Q5MzxJH9/rPmLNG");
bcrypt.compareSync("otra-clave", "$2b$10$EmhODdvgvjIty2STWwKtOeXjCoHoVwOm20Fao8Q5MzxJH9/rPmLNG");
```

Observarás que la **misma contraseña** produce **dos hashes distintos**, y aun así `compareSync` reconoce la contraseña correcta (`true`) y rechaza la incorrecta (`false`). Esto ocurre porque `bcrypt` agrega a cada hash un valor aleatorio llamado **sal** (*salt*), que queda guardado dentro del mismo hash. Escribe `.exit` para salir de la consola de Node y vuelve a levantar el servidor.

**Explicación del fragmento de código anterior:**

```text
hashSync(contraseña, 10)        → genera el hash. El 10 indica cuánto trabajo cuesta calcularlo:
                                  mientras más alto, más lento es adivinar contraseñas por fuerza bruta.
compareSync(contraseña, hash)   → verifica si una contraseña corresponde a un hash.
```

***Nota:*** Utilizamos `bcryptjs`, que está escrito completamente en JavaScript y funciona igual en cualquier sistema operativo. Existe también el paquete `bcrypt`, más rápido, pero depende de código nativo.

## 6. Registrar usuarios (Paso 3)

En `routes/usuarios.js`, importa `bcryptjs` y, en el paso 3, crea la ruta de registro:

```javascript
const bcrypt = require("bcryptjs");
```

```javascript
router.post("/", async (req, res) => {
  const datos = req.body;
  if (!datos || !datos.username || !datos.password) {
    return res.status(400).json({ error: "Debes enviar username y password" });
  }
  if (datos.password.length < 8) {
    return res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres" });
  }
  if (usuarios.some((u) => u.username === datos.username)) {
    return res.status(409).json({ error: "El nombre de usuario ya existe" });
  }

  const nuevoUsuario = {
    id: Math.max(...usuarios.map((u) => u.id)) + 1,
    username: datos.username,
    passwordHash: await bcrypt.hash(datos.password, 10)
  };
  usuarios.push(nuevoUsuario);

  res.status(201).json({ id: nuevoUsuario.id, username: nuevoUsuario.username });
});
```

**Explicación del fragmento de código anterior:**

```text
async / await          → bcrypt.hash() tarda un momento en calcular el hash; await espera el resultado.
status(409)            → "Conflict": la petición es correcta, pero choca con un dato que ya existe.
res.status(201).json   → responde SIN el passwordHash: nunca se envía un hash al cliente.
```

En `servidor.js`, en los comentarios del paso 3, importa el router y móntalo en `/api/usuarios`:

```javascript
const usuariosRouter = require("./routes/usuarios");
```

```javascript
app.use("/api/usuarios", usuariosRouter);
```

Prueba en Postman **Registrar usuario** (`201`). Envíala una segunda vez (`409`) y luego prueba **Registrar usuario con contraseña corta** (`400`).

***Nota:*** Los usuarios se guardan en memoria, igual que las publicaciones. Al reiniciar el servidor, los usuarios registrados se pierden y solo quedan los tres usuarios de prueba.

## 7. Iniciar sesión y JWT (Paso 4)

Detén el servidor (Ctrl+C) e instala `jsonwebtoken`:

```bash
npm view jsonwebtoken
npm install jsonwebtoken
npm run dev
```

En `routes/login.js`, importa ambos paquetes y crea la ruta de inicio de sesión:

```javascript
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
```

```javascript
router.post("/", async (req, res) => {
  const datos = req.body;
  if (!datos || !datos.username || !datos.password) {
    return res.status(400).json({ error: "Debes enviar username y password" });
  }

  const usuario = usuarios.find((u) => u.username === datos.username);
  const passwordCorrecta = usuario ? await bcrypt.compare(datos.password, usuario.passwordHash) : false;

  if (!passwordCorrecta) {
    return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
  }

  const token = jwt.sign(
    { id: usuario.id, username: usuario.username },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRA || "1h" }
  );

  res.json({ token, id: usuario.id, username: usuario.username });
});
```

**Explicación del fragmento de código anterior:**

```text
bcrypt.compare(...)        → verifica la contraseña contra el hash guardado.
"Usuario o contraseña..."  → el mensaje no dice cuál de los dos está mal: así no revelamos
                             qué nombres de usuario existen.
jwt.sign(datos, clave, opciones)
  { id, username }         → los datos que viajan dentro del token (el payload).
  process.env.JWT_SECRET   → la clave secreta con la que se firma el token.
  expiresIn                → el token deja de ser válido después de ese tiempo.
```

En `servidor.js`, en los comentarios del paso 4, importa el router y móntalo en `/api/login`:

```javascript
const loginRouter = require("./routes/login");
```

```javascript
app.use("/api/login", loginRouter);
```

Prueba en Postman **Login con contraseña incorrecta** (`401`) y luego **Login (ana)** (`200`). La respuesta contiene el token:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhbmEi...",
  "id": 1,
  "username": "ana"
}
```

Un JWT tiene tres partes separadas por puntos:

```text
eyJhbGciOiJIUzI1NiIs...  .  eyJpZCI6MSwidXNlcm5h...  .  Xz8kP2...
        header                     payload                firma
```

```text
header   → el algoritmo con que se firmó el token.
payload  → los datos: { "id": 1, "username": "ana", "iat": ..., "exp": ... }
           iat = fecha de emisión, exp = fecha de expiración.
firma    → se calcula con el header, el payload y la clave secreta.
```

***Importante:*** El payload **no está cifrado**: está codificado en Base64 y cualquiera puede leerlo. Lo que impide modificarlo es la **firma**: si alguien cambia el payload, la firma deja de coincidir. Por eso el token **nunca** debe contener datos sensibles, como contraseñas.

***Nota:*** Las peticiones de login de la colección tienen un script en la pestaña **Scripts → Post-response**, que guarda automáticamente el token en la variable `{{token}}` de la colección. Las peticiones protegidas lo envían desde la pestaña **Authorization**, con el tipo **Bearer Token**.

## 8. Proteger endpoints con un middleware (Paso 5)

En `middleware/auth.js`, crea el middleware que verifica el token:

```javascript
const jwt = require("jsonwebtoken");

const verificarToken = (req, res, next) => {
  const autorizacion = req.get("Authorization");

  if (!autorizacion || !autorizacion.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token requerido" });
  }

  const token = autorizacion.replace("Bearer ", "");
  req.usuario = jwt.verify(token, process.env.JWT_SECRET);
  next();
};

module.exports = verificarToken;
```

**Explicación del fragmento de código anterior:**

```text
req.get("Authorization")   → lee el header Authorization de la petición.
startsWith("Bearer ")      → el token debe enviarse con el formato: Bearer <token>
jwt.verify(token, clave)   → verifica la firma y la expiración, y devuelve el payload.
                             Si el token no es válido, lanza un error (lo manejaremos en el paso 6).
req.usuario = ...          → guarda los datos del usuario para que las rutas puedan usarlos.
next()                     → el token es válido: continúa hacia la ruta.
```

En el Taller 8 registramos los middlewares para **todas** las peticiones con `app.use(...)`. Este middleware, en cambio, se aplica solo a las rutas que queremos proteger, escribiéndolo **antes** de la función de la ruta. En `routes/usuarios.js`, importa el middleware y, en el paso 5, crea una ruta protegida:

```javascript
const verificarToken = require("../middleware/auth");
```

```javascript
router.get("/yo", verificarToken, (req, res) => {
  const usuario = usuarios.find((u) => u.id === req.usuario.id);
  if (!usuario) {
    return res.status(404).json({ error: "Usuario no encontrado" });
  }
  res.json({ id: usuario.id, username: usuario.username });
});
```

```text
router.get("/yo", verificarToken, (req, res) => {...})
                  ↑ primero se ejecuta    ↑ solo si verificarToken llama a next()
```

Prueba en Postman, después de **Login (ana)**: **Mi perfil** (`200` con los datos de ana) y **Mi perfil sin token** (`401`).

## 9. Errores del token (Paso 6)

Envía la petición **Mi perfil con token alterado**: el token tiene un carácter de más al final. El servidor responde `500 Error interno del servidor`, y en la terminal aparece `invalid signature`.

`jwt.verify()` lanzó un error porque la firma no coincide, y ese error llegó al `manejadorErrores` del Taller 8. Pero un token inválido no es un error interno: es un problema de autenticación. En `servidor.js`, en el paso 6 del `manejadorErrores`, agrega:

```javascript
  if (error.name === "TokenExpiredError") {
    return res.status(401).json({ error: "Token expirado" });
  }

  if (error.name === "JsonWebTokenError") {
    return res.status(401).json({ error: "Token inválido" });
  }
```

**Explicación del fragmento de código anterior:**

```text
TokenExpiredError   → el token es auténtico, pero ya pasó su fecha de expiración (exp).
JsonWebTokenError   → el token fue modificado, está mal formado o se firmó con otra clave.
```

Vuelve a enviar **Mi perfil con token alterado**: ahora responde `401` con `Token inválido`.

***Nota:*** En Express 5, los errores que ocurren dentro de los middlewares y las rutas (incluidas las funciones `async`) llegan automáticamente al manejador de errores.

## 10. Proteger y autorizar las publicaciones (Paso 7)

Ahora aplicaremos lo anterior a las publicaciones. En `routes/posts.js`, importa el middleware:

```javascript
const verificarToken = require("../middleware/auth");
```

**Crear (POST):** protege la ruta y toma el autor desde el token, no desde el body:

```javascript
router.post("/", verificarToken, (req, res) => {
```

```javascript
    userId: req.usuario.id,
```

**Eliminar (DELETE):** protege la ruta y, después de verificar que la publicación existe, verifica que el usuario sea el autor. Reemplaza el uso de `some()` por `find()`, ya que necesitamos la publicación:

```javascript
router.delete("/:id", verificarToken, (req, res) => {
  const id = Number(req.params.id);
  const post = posts.find((p) => p.id === id);
  if (!post) {
    return res.status(404).json({ error: "Publicación no encontrada" });
  }
  if (post.userId !== req.usuario.id) {
    return res.status(403).json({ error: "Solo el autor puede modificar esta publicación" });
  }
  posts = posts.filter((p) => p.id !== id);
  res.status(204).end();
});
```

**Actualizar (PUT):** protege la ruta, agrega la misma verificación del autor después del `404`, y mantén el autor original:

```javascript
router.put("/:id", verificarToken, (req, res) => {
```

```javascript
  if (post.userId !== req.usuario.id) {
    return res.status(403).json({ error: "Solo el autor puede modificar esta publicación" });
  }
```

```javascript
    userId: post.userId,
```

**Explicación de los cambios anteriores:**

```text
verificarToken             → sin un token válido, la petición se detiene con 401.
userId: req.usuario.id     → el autor es quien envía la petición, aunque el body diga otra cosa.
post.userId !== ...        → si el usuario no es el autor, se detiene con 403.
userId: post.userId        → al editar, el autor no cambia.
```

Las rutas `GET` **no** cambian: cualquiera puede leer las publicaciones.

Prueba en Postman, en este orden:

1. **Login (ana)**.
2. **Crear publicación** (`201`). Observa que el body envía `"userId": 3`, pero la publicación se crea con `"userId": 1`: el autor sale del token.
3. **Crear publicación sin token** (`401`).
4. **Editar publicación propia** (`200`).
5. **Editar publicación ajena** y **Eliminar publicación ajena** (`403`): la publicación 5 es de carla.
6. **Login (carla)** y luego **Eliminar publicación propia** (`204`).

---
# Parte 2: Proteger la aplicación (frontend)

## 11. La aplicación

Abre `http://localhost:8100`. La aplicación del Taller 8 tiene algunos cambios, ya listos:

- Una página de **inicio de sesión** (`/login`).
- En la barra superior se muestra el usuario de la sesión y el botón **Salir**.
- Solo **tus** publicaciones se pueden editar o eliminar (aparecen marcadas como **Tuya**).
- El formulario ya no permite elegir el usuario: el servidor lo toma del token.
- Si el servidor responde `401` (por ejemplo, porque el token expiró), la aplicación cierra la sesión y vuelve al inicio de sesión.

La sesión (el token, el `id` y el `username`) se guarda en `localStorage` mediante las funciones de `src/services/sesion.ts`, para que se mantenga aunque se recargue la página.

Al abrir la aplicación, verás las publicaciones y un aviso: *"No has iniciado sesión..."*. La página debería estar protegida, pero aún no lo está (paso 10). Presiona **Ingresar** e intenta iniciar sesión como `ana`: aparece el mensaje *"Paso 8 pendiente"*.

## 12. Iniciar sesión (Paso 8)

En `src/services/api.ts`, completa `iniciarSesion`, reemplazando la línea `throw new Error(...)`:

```tsx
export const iniciarSesion = async (username: string, password: string): Promise<Sesion> => {
  const response = await fetch(`${API_URL}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  return procesarRespuesta(response);
};
```

La página de inicio de sesión guarda la respuesta con `guardarSesion()` y abre las publicaciones.

Prueba iniciar sesión con una contraseña incorrecta (aparece el mensaje del servidor) y luego como `ana`. Ahora aparece el usuario en la barra superior, pero también el mensaje *"Hay una sesión, pero el servidor no recibió el token"*. Al entrar a la página, la aplicación verifica la sesión con la ruta protegida `GET /api/usuarios/yo`, y esa petición todavía no envía el token.

## 13. Enviar el token (Paso 9)

Todas las peticiones protegidas utilizan la función `encabezadosConToken()`. Complétala para que agregue el header `Authorization` cuando hay una sesión:

```tsx
export const encabezadosConToken = (): Record<string, string> => {
  const sesion = obtenerSesion();
  const encabezados: Record<string, string> = {};
  if (sesion) {
    encabezados.Authorization = `Bearer ${sesion.token}`;
  }
  return encabezados;
};
```

Observa cómo la utilizan las demás funciones del archivo:

```tsx
headers: { "Content-Type": "application/json", ...encabezadosConToken() }
```

**Explicación del fragmento de código anterior:**

```text
Record<string, string>     → un objeto cuyas claves y valores son textos (los headers).
`Bearer ${sesion.token}`   → el formato que espera verificarToken en el servidor.
...encabezadosConToken()   → los tres puntos (spread) copian los headers del objeto dentro de otro.
                             Resultado: { "Content-Type": "...", Authorization: "Bearer ..." }
```

Recarga la aplicación: ya no aparece el mensaje. Crea una publicación, edita una de las tuyas y elimina otra.

Observa la terminal del backend. Antes del paso 9, `morgan` mostraba solo `GET /api/usuarios/yo 401`. Ahora aparece también una petición `OPTIONS`:

```text
OPTIONS /api/usuarios/yo 204 0 - 0.100 ms
GET /api/usuarios/yo 200 25 - 2.928 ms
```

Es la **verificación previa (preflight)** del Taller 7. Un `GET` sin headers adicionales no la necesita, pero el header `Authorization` obliga al navegador a pedir permiso antes de enviarlo. `cors()` lo autoriza.

## 14. Proteger la ruta (Paso 10)

Cierra la sesión con **Salir** y escribe en el navegador `http://localhost:8100/publicaciones`: la página se abre igual, con el aviso de que no has iniciado sesión. Vamos a protegerla.

En `src/App.tsx`, importa `obtenerSesion` y crea el componente `RutaProtegida`, antes del componente `App`:

```tsx
import { obtenerSesion } from './services/sesion';
```

```tsx
const RutaProtegida = ({ children }: { children: React.ReactElement }) =>
  obtenerSesion() ? children : <Navigate to="/login" replace />;
```

Luego, envuelve la página de publicaciones con `RutaProtegida`:

```tsx
<Route
  path="/publicaciones"
  element={
    <RutaProtegida>
      <PublicacionesPage />
    </RutaProtegida>
  }
/>
```

**Explicación del fragmento de código anterior:**

```text
children                         → lo que se escribe entre <RutaProtegida> y </RutaProtegida>.
obtenerSesion() ? children : ... → si hay una sesión, muestra la página; si no, redirige.
<Navigate to="/login" replace /> → la misma redirección del App.tsx original, ahora hacia el login.
```

Escribe nuevamente `http://localhost:8100/publicaciones`: ahora la aplicación te lleva al inicio de sesión.

***Importante:*** Proteger una ruta en el frontend solo **oculta** la página: es una comodidad para el usuario, no una medida de seguridad. Cualquier persona puede enviar peticiones directamente al servidor con Postman. Lo que realmente protege los datos es la verificación del token **en el servidor** (Parte 1).

## 15. Experimentos

**El payload no es secreto.** Inicia sesión y abre la consola del navegador (F12). Escribe:

```javascript
const token = JSON.parse(localStorage.getItem("taller9-sesion")).token;
JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
```

Verás el payload completo (`id`, `username`, `iat` y `exp`) sin necesitar la clave secreta. Cualquiera que obtenga un token puede leerlo, pero no modificarlo sin que la firma deje de coincidir.

***Nota:*** Si Chrome no permite pegar texto en la consola, escribe `allow pasting` y presiona Enter.

**La expiración.** En el archivo `.env` del backend, cambia `JWT_EXPIRA=1h` por `JWT_EXPIRA=30s` y guarda (el servidor se reinicia solo). Inicia sesión, espera más de 30 segundos e intenta editar una de tus publicaciones: el servidor responde `401 Token expirado` y la aplicación vuelve al inicio de sesión. Al terminar, vuelve a dejar `JWT_EXPIRA=1h`.

**Ocultar no es proteger.** En `src/pages/PublicacionesPage.tsx`, cambia la constante `MOSTRAR_ACCIONES_EN_TODAS` a `true`. Ahora la aplicación muestra los botones de editar y eliminar en **todas** las publicaciones. Como `ana`, intenta editar la publicación de carla: el servidor responde `403` con *"Solo el autor puede modificar esta publicación"*. Al terminar, vuelve a dejar la constante en `false`.

**Cerrar sesión no invalida el token.** Inicia sesión y copia el token desde la consola (con la primera línea del primer experimento, escribiendo luego `token`). Presiona **Salir** en la aplicación. En Postman, abre **Mi perfil**, ve a la pestaña **Authorization** y reemplaza `{{token}}` por el token copiado: el servidor responde `200`. El token sigue siendo válido hasta su fecha de expiración, aunque la aplicación ya lo haya olvidado. Por eso los tokens deben tener una expiración corta.

## 16. Comparación con el taller anterior

| Taller 8 | Taller 9 |
|---|---|
| El servidor no sabe quién hace cada petición | El servidor identifica al usuario por su token |
| Cualquiera puede crear, editar y eliminar | Crear exige un token; editar y eliminar, ser el autor |
| El `userId` se elige en el formulario | El `userId` se toma del token |
| Todas las rutas son públicas | Las rutas que modifican datos están protegidas |
| Errores `400` y `404` | Además, `401`, `403` y `409` |
| Middlewares para todas las peticiones (`app.use`) | Además, un middleware para rutas específicas |
| La configuración está en el código | La clave secreta está en una variable de entorno |

> En el Taller 8 la API permitía modificar los datos. Ahora sabe **quién** hace cada petición y decide **qué** puede hacer. La aplicación ayuda al usuario mostrando solo lo que puede hacer, pero la protección real está en el servidor.

---
# Desafío

1. Agrega a la aplicación una página de **registro** (`/registro`) que utilice la ruta `POST /api/usuarios`, y un enlace a ella desde la página de inicio de sesión. Muestra los mensajes de error del servidor (`400` y `409`).
2. Crea la ruta protegida `PUT /api/usuarios/yo/password`, que permita cambiar la contraseña. Debe recibir la contraseña actual y la nueva, verificar la actual con `bcrypt.compare` (`401` si no coincide) y guardar el hash de la nueva.

## Para seguir aprendiendo

Este taller cubre solo los fundamentos. En aplicaciones reales también se utilizan:

- **Refresh tokens**: tokens de corta duración que se renuevan sin volver a iniciar sesión.
- **Cookies `httpOnly`**: una alternativa a `localStorage` que impide que el código JavaScript de la página lea el token, lo que protege ante ataques de inyección de código (XSS).
- **Roles**: por ejemplo, un administrador que puede eliminar cualquier publicación.
- **Limitar los intentos de inicio de sesión**, para dificultar que se adivinen contraseñas.
- **HTTPS**: en producción, los tokens y contraseñas siempre deben viajar cifrados.


## Referencias

- Full Stack Open, parte 4 - Autenticación basada en token: https://fullstackopen.com/es/part4/autenticacion_basada_en_token
- Full Stack Open, parte 5 - Login in frontend: https://fullstackopen.com/en/part5/login_in_frontend
- Introducción a JSON Web Tokens: https://jwt.io/introduction
- Paquete jsonwebtoken: https://www.npmjs.com/package/jsonwebtoken
- Paquete bcryptjs: https://www.npmjs.com/package/bcryptjs
- Node.js - Opción `--env-file`: https://nodejs.org/api/cli.html#--env-fileconfig
- MDN - 401 Unauthorized: https://developer.mozilla.org/es/docs/Web/HTTP/Status/401
- MDN - 403 Forbidden: https://developer.mozilla.org/es/docs/Web/HTTP/Status/403
- MDN - Header Authorization: https://developer.mozilla.org/es/docs/Web/HTTP/Headers/Authorization
