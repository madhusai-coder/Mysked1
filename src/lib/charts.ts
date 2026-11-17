import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

export const chartGridColor = (theme: 'dark' | 'light') =>
  theme === 'dark' ? 'rgba(148, 163, 184, 0.12)' : 'rgba(15, 23, 42, 0.08)';

export const chartTextColor = (theme: 'dark' | 'light') =>
  theme === 'dark' ? '#94a3b8' : '#475569';
