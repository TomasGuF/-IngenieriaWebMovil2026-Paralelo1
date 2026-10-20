const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const autorizacion = req.get("Authorization");
  if (!autorizacion || !autorizacion.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token requerido" });
  }
  req.usuario = jwt.verify(autorizacion.slice(7), process.env.JWT_SECRET, { algorithms: ["HS256"] });
  next();
};
