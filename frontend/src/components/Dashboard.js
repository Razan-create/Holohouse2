import React, { useEffect, useState } from "react";
import { listFiles } from "../services/api";
import "./Dashboard.css";
import { Link } from "react-router-dom";
import Chart from "chart.js/auto";

function Dashboard() {
  const [filesData, setFilesData] = useState([]);
  const [aggregatedData, setAggregatedData] = useState(null);
  const [chart, setChart] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const token = localStorage.getItem('token');
        const files = await listFiles(token);
        
        if (files && files.length > 0) {
          setFilesData(files);
          
          // Aggregera data från alla filer
          const aggregated = aggregateAllFiles(files);
          setAggregatedData(aggregated);
          
          renderChart(aggregated);
        }
      } catch (error) {
        console.error("Kunde inte ladda data", error);
      }
    }

    fetchData();
  }, []);

  // Aggregera data från alla uppladdade filer
  const aggregateAllFiles = (files) => {
    const allCategories = [];
    const emissionTypes = new Set();
    let totalCost = 0;
    let totalEnergy = 0;
    let totalItems = 0;

    files.forEach(file => {
      if (file.analysisData && file.analysisData.categories) {
        allCategories.push(...file.analysisData.categories);
        
        // Samla alla utsläppstyper
        if (file.analysisData.summary && file.analysisData.summary.totalEmissions) {
          Object.keys(file.analysisData.summary.totalEmissions).forEach(type => {
            emissionTypes.add(type);
          });
        }

        // Summera totaler
        if (file.analysisData.summary) {
          const s = file.analysisData.summary;
          totalCost += s.totalCost || 0;
          totalEnergy += s.totalEnergy || 0;
          totalItems += s.totalItems || 0;
        }
      }
    });

    // Beräkna totala utsläpp per typ
    const totalEmissions = {};
    emissionTypes.forEach(type => {
      totalEmissions[type] = files.reduce((sum, file) => {
        if (file.analysisData?.summary?.totalEmissions?.[type]) {
          return sum + file.analysisData.summary.totalEmissions[type];
        }
        return sum;
      }, 0);
    });

    return {
      categories: allCategories,
      emissionTypes: Array.from(emissionTypes),
      totalEmissions,
      totalCost,
      totalEnergy,
      totalItems,
      fileCount: files.length
    };
  };

  const renderChart = (data) => {
    const canvas = document.getElementById("categoryChart");
    if (!canvas || !data || !data.categories || data.categories.length === 0) return;

    if (chart) {
      chart.destroy();
    }

    // Skapa chart med kategorier och deras totala utsläpp
    const labels = data.categories.map(c => c.name);
    const values = data.categories.map(c => {
      const emissions = c.totals?.emissions || {};
      return Object.values(emissions).reduce((sum, val) => sum + val, 0);
    });

    const newChart = new Chart(canvas, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Totala utsläpp (kg)",
            data: values,
            backgroundColor: "#1a5e3b",
            borderColor: "#0f3d25",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
          },
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      },
    });

    setChart(newChart);
  };

  if (!aggregatedData) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Miljödata – översikt</h1>
          <p className="no-data">Laddar data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Miljödata – översikt</h1>
        <p className="updated-text">
          Baserat på {aggregatedData.fileCount} uppladdade fil(er)
        </p>
        <Link to="/upload" className="back-button">
          Till filer
        </Link>
      </div>

      {/* Dynamiska KPI-kort baserat på vilka utsläppstyper som finns */}
      <div className="kpi-row">
        {aggregatedData.emissionTypes.map((emissionType) => (
          <div className="kpi-card" key={emissionType}>
            <h3>{emissionType.toUpperCase()} (kg)</h3>
            <p className="kpi-label">Totala utsläpp av {emissionType}</p>
            <p className="kpi-value">
              {aggregatedData.totalEmissions[emissionType].toLocaleString('sv-SE')}
            </p>
          </div>
        ))}

        {aggregatedData.totalEnergy > 0 && (
          <div className="kpi-card">
            <h3>Energi (kWh)</h3>
            <p className="kpi-label">Total energiförbrukning</p>
            <p className="kpi-value">
              {aggregatedData.totalEnergy.toLocaleString('sv-SE')}
            </p>
          </div>
        )}

        <div className="kpi-card">
          <h3>Kostnad (kr)</h3>
          <p className="kpi-label">Total kostnad</p>
          <p className="kpi-value">
            {aggregatedData.totalCost.toLocaleString('sv-SE')}
          </p>
        </div>

        <div className="kpi-card">
          <h3>Antal</h3>
          <p className="kpi-label">Totalt antal enheter</p>
          <p className="kpi-value">
            {aggregatedData.totalItems}
          </p>
        </div>
      </div>

      {/* Diagram */}
      <div className="graph-card">
        <h3 className="graph-title">Utsläpp per kategori</h3>
        <div className="graph-wrapper">
          <canvas id="categoryChart"></canvas>
        </div>
      </div>

      {/* Kategorier-tabell */}
      <div className="table-card">
        <h3 className="table-title">Kategorier</h3>
        <table className="history-table">
          <thead>
            <tr>
              <th>Kategori</th>
              <th>Antal</th>
              <th>Utsläpp (kg)</th>
              <th>Kostnad (kr)</th>
              <th>Energi (kWh)</th>
            </tr>
          </thead>
          <tbody>
            {aggregatedData.categories.map((cat, idx) => {
              const totalEmissions = Object.values(cat.totals?.emissions || {})
                .reduce((sum, val) => sum + val, 0);
              
              return (
                <tr key={idx}>
                  <td><strong>{cat.name}</strong></td>
                  <td>{cat.totals?.quantity || 0}</td>
                  <td>{totalEmissions.toLocaleString('sv-SE')}</td>
                  <td>{(cat.totals?.cost || 0).toLocaleString('sv-SE')}</td>
                  <td>{(cat.totals?.energy || 0).toLocaleString('sv-SE')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Dashboard;