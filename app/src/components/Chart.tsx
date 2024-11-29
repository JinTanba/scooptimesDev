//@ts-nocheck
import React, { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi } from 'lightweight-charts';

interface Props {
  contractAddress: string;
}

const themes = {
  light: {
    layout: {
      background: { color: '#ffffff' },
      textColor: '#333333',
    },
    grid: {
      vertLines: { color: '#e6e6e6' },
      horzLines: { color: '#e6e6e6' },
    },
    crosshair: {
      mode: 'normal',
      vertLine: {
        color: '#758696',
        width: 1,
        style: 3,
        labelBackgroundColor: '#758696',
      },
      horzLine: {
        color: '#758696',
        width: 1,
        style: 3,
        labelBackgroundColor: '#758696',
      },
    },
    rightPriceScale: {
      borderColor: '#e6e6e6',
    },
    timeScale: {
      borderColor: '#e6e6e6',
      timeVisible: true,
    },
  },
  dark: {
    layout: {
      background: { color: '#1E222D' },
      textColor: '#DDD',
    },
    grid: {
      vertLines: { color: '#2B2B43' },
      horzLines: { color: '#2B2B43' },
    },
    crosshair: {
      mode: 'normal',
      vertLine: {
        color: '#758696',
        width: 1,
        style: 3,
        labelBackgroundColor: '#758696',
      },
      horzLine: {
        color: '#758696',
        width: 1,
        style: 3,
        labelBackgroundColor: '#758696',
      },
    },
    rightPriceScale: {
      borderColor: '#2B2B43',
    },
    timeScale: {
      borderColor: '#2B2B43',
      timeVisible: true,
    },
  },
};

const ThemeSwitchableChart: React.FC<Props> = ({ contractAddress }) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chart = useRef<IChartApi | null>(null);
  const series = useRef<ISeriesApi<"Candlestick"> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    chart.current = createChart(chartContainerRef.current, {
      width: 800,
      height: 300,
      ...themes[isDarkMode ? 'dark' : 'light'],
    });

    series.current = chart.current.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    const fetchData = async () => {
      try {
        const response = await fetch(`/api/getChartData?address=${contractAddress}`);
        const data: CandleData[] = await response.json();
        console.log('data-------------------------------\n\n', data);
        if (series.current && data.length > 0) {
          series.current.setData(data);
        }
      } catch (error) {
        console.error('Failed to fetch chart data:', error);
      }
    };

    fetchData();

    const handleResize = () => {
      if (chart.current && chartContainerRef.current) {
        chart.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chart.current) {
        chart.current.remove();
      }
    };
  }, [isDarkMode, contractAddress]);

  useEffect(() => {
    if (chart.current) {
      chart.current.applyOptions(themes[isDarkMode ? 'dark' : 'light']);
    }
  }, [isDarkMode]);

  return (
    <div className="w-full h-full p-4">
      <div className="w-full h-full" ref={chartContainerRef} />
    </div>
  );
};

export default ThemeSwitchableChart;