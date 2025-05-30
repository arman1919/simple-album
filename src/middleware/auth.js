const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your-secret-key'; // В реальном приложении должен быть в .env

const auth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'Отсутствует токен авторизации' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Недействительный токен' });
  }
};

module.exports = { auth, JWT_SECRET };
