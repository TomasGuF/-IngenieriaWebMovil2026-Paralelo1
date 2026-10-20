// Taller 9: Autenticación, autorización y JWT
// API de publicaciones con autenticación y autorización.

if (!process.env.JWT_SECRET) {
  console.error("Falta la variable de entorno JWT_SECRET. Revisa el archivo .env");
  process.exit(1);
}

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const postsRouter = require("./routes/posts");
const usuariosRouter = require("./routes/usuarios");
const loginRouter = require("./routes/login");

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
app.use("/api/usuarios", usuariosRouter);
app.use("/api/login", loginRouter);

const endpointDesconocido = (req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
};

app.use(endpointDesconocido);

const manejadorErrores = (error, req, res, next) => {
  console.error(error.message);

  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ error: "El cuerpo de la petición no es un JSON válido" });
  }

  if (error.name === "TokenExpiredError") {
    return res.status(401).json({ error: "Token expirado" });
  }
  if (["JsonWebTokenError", "NotBeforeError"].includes(error.name)) {
    return res.status(401).json({ error: "Token inválido" });
  }

  res.status(500).json({ error: "Error interno del servidor" });
};

app.use(manejadorErrores);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
