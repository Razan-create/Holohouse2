import React, { useEffect, useState } from "react";
import { getMetrics } from "../services/api";
import "./Dashboard.css";
import { Link } from "react-router-dom";
import Chart from "chart.js/auto";
import Navbar from "./Navbar"; // ✅ NAVBAREN ÄR TILLBAKA

function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [lineChart, setLineChart] = useState(null);

  // Hämta data från backend
  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getMetrics();
        setMetrics(data);
        renderChart(data);
      } catch (error) {
        console.error("Kunde inte ladda data", error);
      }
    }

    fetchData();
  }, []);

  // Rita linjediagram
  const renderChart = (data) => {
    const canvas = document.getElementById("lineChart");
    if (!canvas) return;

    // förstör gammal graf om den finns
    if (lineChart) {
      lineChart.destroy();
    }

    const labels = data?.chart?.labels || [];
    const values = data?.chart?.values || [];

    const newChart = new Chart(canvas, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Tidsserie",
            data: values,
            borderColor: "#1a5e3b",
            borderWidth: 3,
            pointRadius: 3,
            tension: 0.35,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      },
    });

    setLineChart(newChart);
  };

  return (
    <>
    

      {/* Själva dashboard-innehållet */}
      <div className="dashboard-container">
        {/* Header-rad */}
        <div className="dashboard-header">
          <h1>Miljödata – översikt</h1>
          <p className="updated-text">
            Senast uppdaterad:{" "}
            {metrics?.updated || "inga filer har laddats upp ännu"}
          </p>

          <Link to="/upload" className="back-button">
            Till filer
          </Link>
        </div>

        {/* KPI-rad */}
        <div className="kpi-row">
          <div className="kpi-card">
            <h3>CO₂ (ton)</h3>
            <p className="kpi-label">Utsläpp av koldioxid</p>
            <p className="kpi-value">
              {metrics?.co2 ? (
                metrics.co2
              ) : (
                <span className="no-data">Ingen data ännu</span>
              )}
            </p>
          </div>

          <div className="kpi-card">
            <h3>Energi (MWh)</h3>
            <p className="kpi-label">Energianvändning</p>
            <p className="kpi-value">
              {metrics?.energy ? (
                metrics.energy
              ) : (
                <span className="no-data">Ingen data ännu</span>
              )}
            </p>
          </div>

          <div className="kpi-card">
            <h3>Vatten (m³)</h3>
            <p className="kpi-label">Vattenförbrukning</p>
            <p className="kpi-value">
              {metrics?.water ? (
                metrics.water
              ) : (
                <span className="no-data">Ingen data ännu</span>
              )}
            </p>
          </div>
        </div>

        {/* Tidsserie-box */}
        <div className="graph-card">
          <h3 className="graph-title">Tidsserie</h3>
          <div className="graph-wrapper">
            <canvas id="lineChart"></canvas>
          </div>
        </div>

        {/* Tabell-box */}
        <div className="table-card">
          <h3 className="table-title">Detaljer (tabell)</h3>
          <p className="no-data">Ingen data ännu</p>
        </div>
      </div>
    </>
  );
}

export default Dashboard;
