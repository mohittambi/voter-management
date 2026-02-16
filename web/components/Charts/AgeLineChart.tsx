import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

type AgeLineChartProps = {
  data: Record<string, number>;
};

export default function AgeLineChart({ data }: AgeLineChartProps) {
  const ageOrder = ['18-25', '26-35', '36-45', '46-55', '56-65', '65+'];
  const orderedData = ageOrder.map(group => data[group] || 0);

  const chartData = {
    labels: ageOrder.map(group => `${group} years`),
    datasets: [
      {
        label: 'Voters',
        data: orderedData,
        fill: true,
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
        borderColor: 'rgba(139, 92, 246, 1)',
        borderWidth: 2,
        tension: 0.4,
        pointBackgroundColor: 'rgba(139, 92, 246, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
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
        text: 'वयोगट विभाजन / Age Group Distribution',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const total = orderedData.reduce((sum, count) => sum + count, 0);
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
      <Line data={chartData} options={options} />
    </div>
  );
}
