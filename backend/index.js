const express = require('express');
const cors = require('cors');

const dashboardRoutes = require('./routes/dashboardRoutes');
const authRoutes = require('./routes/authRoutes');
const fileRoutes = require('./routes/fileRoutes');   // 👈 ny rad

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

// file-routes  👈 lägg till denna
app.use('/api/files', fileRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
