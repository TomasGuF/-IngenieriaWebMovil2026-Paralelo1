const express = require("express");
const bcrypt = require("bcryptjs");
const usuarios = require("../datos/usuarios");
const verificarToken = require("../middleware/auth");
const router = express.Router();
const passwordValida = (password) => typeof password === "string" && password.length >= 8 && Buffer.byteLength(password, "utf8") <= 72;

router.post("/", async (req, res) => {
  const { username, password } = req.body || {};
  if (typeof username !== "string" || !username.trim() || typeof password !== "string" || !password) {
    return res.status(400).json({ error: "Debes enviar username y password" });
  }
  if (!passwordValida(password)) {
    return res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres y como máximo 72 bytes" });
  }
  if (usuarios.some((u) => u.username === username)) {
    return res.status(409).json({ error: "El nombre de usuario ya existe" });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  // Revalidar después del await para impedir duplicados en registros concurrentes.
  if (usuarios.some((u) => u.username === username)) {
    return res.status(409).json({ error: "El nombre de usuario ya existe" });
  }
  const usuario = { id: Math.max(0, ...usuarios.map((u) => u.id)) + 1, username, passwordHash };
  usuarios.push(usuario);
  res.status(201).json({ id: usuario.id, username: usuario.username });
});

router.get("/yo", verificarToken, (req, res) => {
  const usuario = usuarios.find((u) => u.id === req.usuario.id);
  if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });
  res.json({ id: usuario.id, username: usuario.username });
});

router.put("/yo/password", verificarToken, async (req, res) => {
  const { passwordActual, passwordNueva } = req.body || {};
  if (typeof passwordActual !== "string" || !passwordActual || !passwordValida(passwordNueva)) {
    return res.status(400).json({ error: "Envía passwordActual y passwordNueva (al menos 8 caracteres y como máximo 72 bytes)" });
  }
  const usuario = usuarios.find((u) => u.id === req.usuario.id);
  if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });
  if (!await bcrypt.compare(passwordActual, usuario.passwordHash)) {
    return res.status(401).json({ error: "La contraseña actual no es correcta" });
  }
  usuario.passwordHash = await bcrypt.hash(passwordNueva, 10);
  res.status(204).end();
});
module.exports = router;
