
import React from 'react';

interface RadarStatsProps {
  totalItems: number;
  currentPage: number;
  totalPages: number;
  dataSource: string;
}

const RadarStats = ({ totalItems, currentPage, totalPages, dataSource }: RadarStatsProps) => {
  return (
    <div className="mt-4 flex gap-4 text-sm text-muted-foreground font-sans">
      <span>Total: {totalItems} itens</span>
      <span>Página {currentPage} de {totalPages}</span>
      <span>Fonte: {dataSource}</span>
    </div>
  );
};

export default RadarStats;
