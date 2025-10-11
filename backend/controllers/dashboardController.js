// Här hanteras logik för dashboard-data
const getDashboardData = (req, res) => {
  const data = {
    message: "Detta är grunddata för dashboard",
    stats: {
      energy: 120,
      emissions: 80
    }
  };
  res.json(data);
};

module.exports = { getDashboardData };
