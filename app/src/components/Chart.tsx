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
  const resizeHandler = useRef<(() => void) | null>(null);
  const isComponentMounted = useRef(true);

  useEffect(() => {
    isComponentMounted.current = true;

    const initChart = () => {
      if (!chartContainerRef.current || !isComponentMounted.current) return;

      try {
        chart.current = createChart(chartContainerRef.current, {
          width: chartContainerRef.current.clientWidth || 800,
          height: chartContainerRef.current.clientHeight || 300,
          ...themes[isDarkMode ? 'dark' : 'light'],
        });

        series.current = chart.current.addCandlestickSeries({
          upColor: '#26a69a',
          downColor: '#ef5350',
          borderVisible: false,
          wickUpColor: '#26a69a',
          wickDownColor: '#ef5350',
        });

        // Define resize handler
        resizeHandler.current = () => {
          if (chart.current && chartContainerRef.current && isComponentMounted.current) {
            requestAnimationFrame(() => {
              if (chart.current && chartContainerRef.current && isComponentMounted.current) {
                chart.current.applyOptions({
                  width: chartContainerRef.current.clientWidth,
                  height: chartContainerRef.current.clientHeight,
                });
              }
            });
          }
        };

        // Add resize listener
        window.addEventListener('resize', resizeHandler.current);
      } catch (error) {
        console.error('Failed to initialize chart:', error);
      }
    };

    const fetchData = async () => {
      if (!isComponentMounted.current) return;

      try {
        const response = await fetch(`/api/getChartData?address=${contractAddress}`);
        const data = await response.json();
        
        if (series.current && data.length > 0 && isComponentMounted.current) {
          series.current.setData(data);
        }
      } catch (error) {
        console.error('Failed to fetch chart data:', error);
      }
    };

    initChart();
    fetchData();

    // Cleanup function
    return () => {
      isComponentMounted.current = false;
      
      if (resizeHandler.current) {
        window.removeEventListener('resize', resizeHandler.current);
      }

      // Delayed cleanup of chart to ensure all operations are complete
      setTimeout(() => {
        if (chart.current) {
          try {
            chart.current.remove();
          } catch (e) {
            console.error('Error during chart cleanup:', e);
          }
          chart.current = null;
        }
        series.current = null;
      }, 0);
    };
  }, [isDarkMode, contractAddress]);

  useEffect(() => {
    if (chart.current && isComponentMounted.current) {
      try {
        chart.current.applyOptions(themes[isDarkMode ? 'dark' : 'light']);
      } catch (error) {
        console.error('Failed to apply theme:', error);
      }
    }
  }, [isDarkMode]);

  return (
    <div className="w-full h-full p-4">
      <div className="w-full h-full" ref={chartContainerRef} />
    </div>
  );
};

export default ThemeSwitchableChart;