// src/components/KPICard.js
import React from "react";

const KPICard = ({ title, description, value, change }) => {
  const hasData = value !== null && value !== undefined && value !== "";

  return (
    <div className="kpi-card">
      <h3>{title}</h3>

      {description && <p className="kpi-description">{description}</p>}

      {hasData ? (
        <>
          <p className="kpi-value">{value}</p>
          {change && <p className="kpi-change">{change}</p>}
        </>
      ) : (
        <p className="kpi-placeholder">Ingen data ännu</p>
      )}
    </div>
  );
};

export default KPICard;
