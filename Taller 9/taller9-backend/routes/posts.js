// Rutas de las publicaciones (Taller 8). Se montan en servidor.js en "/api/posts",
// por lo que aquí "/" equivale a "/api/posts" y "/:id" a "/api/posts/:id".

const express = require("express");
const verificarToken = require("../middleware/auth");

const router = express.Router();

let posts = [
  { userId: 1, id: 1, title: "Bienvenidos al Taller 9", body: "En este taller protegeremos nuestra API: solo los usuarios identificados podrán publicar, y solo el autor podrá editar o eliminar sus publicaciones." },
  { userId: 1, id: 2, title: "¿Qué es un backend?", body: "Es la parte de la aplicación que se ejecuta en el servidor y responde a las peticiones de los clientes." },
  { userId: 2, id: 3, title: "Métodos HTTP", body: "GET permite obtener datos, POST crear, PUT actualizar y DELETE eliminar." },
  { userId: 2, id: 4, title: "Formato JSON", body: "Los clientes y el servidor se comunican enviando y recibiendo datos en formato JSON." },
  { userId: 3, id: 5, title: "Postman", body: "Postman es una herramienta que permite enviar peticiones HTTP y revisar las respuestas del servidor." }
];

router.get("/", (req, res) => {
  const userId = req.query.userId;
  if (userId) {
    const filtrados = posts.filter((p) => p.userId === Number(userId));
    return res.json(filtrados);
  }
  res.json(posts);
});

router.get("/:id", (req, res) => {
  const id = Number(req.params.id);
  const post = posts.find((p) => p.id === id);
  if (post) {
    res.json(post);
  } else {
    res.status(404).json({ error: "Publicación no encontrada" });
  }
});

router.post("/", verificarToken, (req, res) => {
  const datos = req.body;
  if (!datos || !datos.title || !datos.body) {
    return res.status(400).json({ error: "Debes enviar title y body" });
  }
  const nuevoPost = {
    userId: req.usuario.id,
    id: posts.length > 0 ? Math.max(...posts.map((p) => p.id)) + 1 : 1,
    title: datos.title,
    body: datos.body
  };
  posts.push(nuevoPost);
  res.status(201).json(nuevoPost);
});

router.delete("/:id", verificarToken, (req, res) => {
  const id = Number(req.params.id);
  const post = posts.find((p) => p.id === id);
  if (!post) {
    return res.status(404).json({ error: "Publicación no encontrada" });
  }
  if (post.userId !== req.usuario.id) return res.status(403).json({ error: "Solo el autor puede modificar esta publicación" });
  posts = posts.filter((p) => p.id !== id);
  res.status(204).end();
});

router.put("/:id", verificarToken, (req, res) => {
  const id = Number(req.params.id);
  const post = posts.find((p) => p.id === id);
  if (!post) {
    return res.status(404).json({ error: "Publicación no encontrada" });
  }
  if (post.userId !== req.usuario.id) return res.status(403).json({ error: "Solo el autor puede modificar esta publicación" });
  const datos = req.body;
  if (!datos || !datos.title || !datos.body) {
    return res.status(400).json({ error: "Debes enviar title y body" });
  }
  const actualizado = {
    userId: post.userId,
    id: post.id,
    title: datos.title,
    body: datos.body
  };
  posts = posts.map((p) => (p.id === id ? actualizado : p));
  res.json(actualizado);
});

module.exports = router;
