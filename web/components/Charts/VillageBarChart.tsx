import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

type VillageBarChartProps = {
  data: Record<string, number>;
};

export default function VillageBarChart({ data }: VillageBarChartProps) {
  // Get top 10 villages
  const sortedVillages = Object.entries(data)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const chartData = {
    labels: sortedVillages.map(([village]) => village),
    datasets: [
      {
        label: 'Voters',
        data: sortedVillages.map(([, count]) => count),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'गावनिहाय विभाजन / Village-wise Distribution (Top 10)',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const total = sortedVillages.reduce((sum, [, count]) => sum + count, 0);
            const percentage = ((context.parsed.x / total) * 100).toFixed(1);
            return `Voters: ${context.parsed.x} (${percentage}%)`;
          },
        },
      },
    },
    scales: {
      x: {
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
