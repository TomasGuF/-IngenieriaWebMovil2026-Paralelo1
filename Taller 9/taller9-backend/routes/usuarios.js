// Rutas de los usuarios. Se montan en servidor.js en "/api/usuarios".

const express = require("express");
// 3: Importar bcryptjs.
const usuarios = require("../datos/usuarios");
// 5: Importar el middleware verificarToken.

const router = express.Router();

// 3: Crear la ruta POST "/" que registre un nuevo usuario.

// 5: Crear la ruta protegida GET "/yo" que responda con los datos del usuario del token.

module.exports = router;
