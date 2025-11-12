// routes/dashboardRoutes.js
const express = require('express');
const { getHealth, getMetrics } = require('../controllers/dashboardController');

const router = express.Router();

// GET /api/dashboard/health
router.get('/health', getHealth);

// GET /api/dashboard/metrics
router.get('/metrics', getMetrics);

module.exports = router;
