import { useEffect, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

type BoothChartProps = {
  data: Record<number, number>;
};

export default function BoothChart({ data }: BoothChartProps) {
  // Get top 15 booths
  const sortedBooths = Object.entries(data)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  const chartData = {
    labels: sortedBooths.map(([booth]) => `Booth ${booth}`),
    datasets: [
      {
        label: 'Voters',
        data: sortedBooths.map(([, count]) => count),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'बुथनिहाय विभाजन / Booth-wise Distribution (Top 15)',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const total = sortedBooths.reduce((sum, [, count]) => sum + count, 0);
            const percentage = ((context.parsed.y / total) * 100).toFixed(1);
            return `Voters: ${context.parsed.y} (${percentage}%)`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  };

  return (
    <div style={{ height: 400 }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}
