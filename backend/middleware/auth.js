const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'zeitnest-secret-key-change-in-production';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Zugang verweigert. Bitte einloggen.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Ungültiges Token. Bitte erneut einloggen.' });
  }
}

module.exports = { authenticateToken, JWT_SECRET };
