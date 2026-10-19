// Taller 9: Autenticación, autorización y JWT
// Este es el servidor del Taller 8 (ya completo). Sigue los pasos del README
// y completa cada sección marcada con un número.

// 1: Verificar que exista la variable de entorno JWT_SECRET.

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const postsRouter = require("./routes/posts");
// 3: Importar el router de usuarios.
// 4: Importar el router de login.

const app = express();

app.use(morgan("tiny"));
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("¡Hola desde mi primer servidor con Express!");
});

app.get("/saludo/:nombre", (req, res) => {
  res.send(`¡Hola, ${req.params.nombre}!`);
});

app.use("/api/posts", postsRouter);
// 3: Montar el router de usuarios en "/api/usuarios".
// 4: Montar el router de login en "/api/login".

const endpointDesconocido = (req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
};

app.use(endpointDesconocido);

const manejadorErrores = (error, req, res, next) => {
  console.error(error.message);

  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ error: "El cuerpo de la petición no es un JSON válido" });
  }

  // 6: Responder 401 cuando el token no es válido o expiró.

  res.status(500).json({ error: "Error interno del servidor" });
};

app.use(manejadorErrores);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
