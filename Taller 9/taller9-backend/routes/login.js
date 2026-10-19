// Ruta de inicio de sesión. Se monta en servidor.js en "/api/login".

const express = require("express");
// 4: Importar bcryptjs y jsonwebtoken.
const usuarios = require("../datos/usuarios");

const router = express.Router();

// 4: Crear la ruta POST "/" que verifique las credenciales y responda con un token.

module.exports = router;
