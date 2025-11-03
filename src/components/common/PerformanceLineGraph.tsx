// components/PerformanceLineGraph.tsx
"use client";

import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface PerformanceData {
  date: string;
  percentage: number;
  totalQuestions: number;
  correctAnswers: number;
}

interface PerformanceLineGraphProps {
  data: PerformanceData[];
  startDate: string;
  endDate: string;
}

export default function PerformanceLineGraph({ data, startDate, endDate }: PerformanceLineGraphProps) {
  const getTimeInterval = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = end.getTime() - start.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays > 60) return 'month';
    if (diffDays > 14) return 'week';
    return 'day';
  };

  const formatDateLabel = (dateStr: string, interval: string) => {
    const date = new Date(dateStr);
    if (interval === 'month') {
      return date.toLocaleString('default', { month: 'short', year: 'numeric' });
    } else if (interval === 'week') {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      return `Week of ${weekStart.toLocaleDateString()}`;
    }
    return date.toLocaleDateString();
  };

  const interval = getTimeInterval();
  const groupedData: { [key: string]: { totalCorrect: number; totalQuestions: number } } = {};

  data.forEach(item => {
    const dateLabel = formatDateLabel(item.date, interval);
    if (!groupedData[dateLabel]) {
      groupedData[dateLabel] = { totalCorrect: 0, totalQuestions: 0 };
    }
    groupedData[dateLabel].totalCorrect += item.correctAnswers;
    groupedData[dateLabel].totalQuestions += item.totalQuestions;
  });

  const labels = Object.keys(groupedData);
  const percentages = labels.map(label => {
    const { totalCorrect, totalQuestions } = groupedData[label];
    return totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
  });

  const chartData = {
    labels,
    datasets: [{
      label: 'Performance (%)',
      data: percentages,
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1,
    }],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Performance Over Time' },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: { display: true, text: 'Percentage (%)' },
      },
      x: {
        title: { display: true, text: 'Time' },
      },
    },
  };

  return <Line data={chartData} options={options} />;
}