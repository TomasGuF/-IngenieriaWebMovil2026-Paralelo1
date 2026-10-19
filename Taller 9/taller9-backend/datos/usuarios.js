// Usuarios precargados (ya está listo).
// Las contraseñas NO se guardan: solo su hash, generado con bcryptjs.
// Contraseñas de prueba (están en el README): ana-12345, benjamin-12345, carla-12345

const usuarios = [
  { id: 1, username: "ana", passwordHash: "$2b$10$EmhODdvgvjIty2STWwKtOeXjCoHoVwOm20Fao8Q5MzxJH9/rPmLNG" },
  { id: 2, username: "benjamin", passwordHash: "$2b$10$qgqYrWGlWEmGu.8glfiVq.dJSPhMjxTbrVpfkkNSOKk0XdFMPXqBi" },
  { id: 3, username: "carla", passwordHash: "$2b$10$10D.9KQ8gMBDxscTWPbmVOMWHSxpsJubwUDj1T8NELgBdSovaQj7K" }
];

module.exports = usuarios;
