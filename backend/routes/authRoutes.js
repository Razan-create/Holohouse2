// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();

// TEMP: "databas" i minnet bara för utveckling
const users = [];

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Namn, e-post och lösenord krävs' });
  }

  const exists = users.find(u => u.email === email);
  if (exists) {
    return res.status(409).json({ message: 'E-post används redan' });
  }

  const newUser = {
    id: users.length + 1,
    name,
    email,
    password // OBS: bara för demo, ingen hash här!
  };
  users.push(newUser);

  // skicka tillbaka användaren utan lösenord
  const { password: _, ...safeUser } = newUser;
  res.status(201).json({ message: 'User created', user: safeUser });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ message: 'Fel e-post eller lösenord' });
  }

  // Fake-token för nu – backend kan byta till riktig JWT senare
  const token = 'dummy-token-' + user.id;
  const { password: _, ...safeUser } = user;

  res.json({ token, user: safeUser });
});

module.exports = router;
