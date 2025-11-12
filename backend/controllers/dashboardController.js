// controllers/dashboardController.js

exports.getHealth = (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'holohouse2-backend',
    timestamp: new Date().toISOString(),
  });
};

exports.getMetrics = (_req, res) => {
  const now = new Date();
  const series = Array.from({ length: 12 }, (_, i) => ({
    timestamp: new Date(now.getFullYear(), now.getMonth() - (11 - i), 1).toISOString(),
    value: 50 + Math.round(Math.random() * 50),
  }));

  const kpis = [
    { key: 'co2', label: 'CO₂ (ton)', value: 1234, trend: -4.2 },
    { key: 'energy', label: 'Energi (MWh)', value: 890, trend: 2.1 },
    { key: 'water', label: 'Vatten (m³)', value: 450, trend: -1.3 },
  ];

  res.json({
    lastUpdated: new Date().toISOString(),
    kpis,
    series,
  });
};
