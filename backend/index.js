// backend/index.js
const express = require('express');
const cors = require('cors');

const dashboardRoutes = require('./routes/dashboardRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

// middleware
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// enkel root
app.get('/', (_req, res) => {
  res.send('Holohouse2 backend – prova /api/dashboard/metrics eller auth-routes.');
});

// dashboard-routes
app.use('/api/dashboard', dashboardRoutes);

// auth-routes
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
