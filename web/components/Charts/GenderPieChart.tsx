import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

type GenderPieChartProps = {
  data: Record<string, number>;
};

export default function GenderPieChart({ data }: GenderPieChartProps) {
  const total = Object.values(data).reduce((sum, count) => sum + count, 0);

  const chartData = {
    labels: Object.keys(data).map(gender => 
      gender === 'M' ? '👨 पुरुष / Male' : gender === 'F' ? '👩 स्त्री / Female' : gender
    ),
    datasets: [
      {
        label: 'Voters',
        data: Object.values(data),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',  // Blue for Male
          'rgba(236, 72, 153, 0.8)',  // Pink for Female
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(236, 72, 153, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          font: {
            size: 14,
          },
          padding: 20,
        },
      },
      title: {
        display: true,
        text: 'लिंग विभाजन / Gender Distribution',
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div style={{ height: 400 }}>
      <Pie data={chartData} options={options} />
    </div>
  );
}
