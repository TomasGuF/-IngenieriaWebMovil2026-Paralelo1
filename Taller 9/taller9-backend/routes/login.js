const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const usuarios = require("../datos/usuarios");
const router = express.Router();

router.post("/", async (req, res) => {
  const { username, password } = req.body || {};
  if (typeof username !== "string" || !username.trim() || typeof password !== "string" || !password) {
    return res.status(400).json({ error: "Debes enviar username y password" });
  }
  const usuario = usuarios.find((u) => u.username === username);
  if (!usuario || !await bcrypt.compare(password, usuario.passwordHash)) {
    return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
  }
  const token = jwt.sign({ id: usuario.id, username: usuario.username }, process.env.JWT_SECRET,
    { algorithm: "HS256", expiresIn: process.env.JWT_EXPIRA || "1h" });
  res.json({ token, id: usuario.id, username: usuario.username });
});
module.exports = router;
