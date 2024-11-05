// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi } from 'lightweight-charts';

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

const ThemeSwitchableChart: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chart = useRef<IChartApi | null>(null);
  const series = useRef<ISeriesApi<"Candlestick"> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // チャートの初期化
    // @ts-ignore
    chart.current = createChart(chartContainerRef.current, {
      width: 800,
      height: 300,
      ...themes[isDarkMode ? 'dark' : 'light'],
    });

    // ローソク足シリーズの追加
    series.current = chart.current.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    // サンプルデータ
    series.current.setData([
      { time: '2024-01-01', open: 0.000003000, high: 0.000003418, low: 0.000003349, close: 0.000003349 },
      { time: '2024-01-02', open: 0.000003349, high: 0.000003500, low: 0.000003000, close: 0.000003349 },
      { time: '2024-01-03', open: 0.000003349, high: 0.000003600, low: 0.000003200, close: 0.000003400 },
      { time: '2024-01-04', open: 0.000003400, high: 0.000003700, low: 0.000003300, close: 0.000003600 },
      { time: '2024-01-05', open: 0.000003600, high: 0.000003800, low: 0.000003500, close: 0.000003700 },
    ]);

    // レスポンシブ対応
    const handleResize = () => {
      if (chart.current && chartContainerRef.current) {
        chart.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // 初期サイズを設定

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chart.current) {
        chart.current.remove();
      }
    };
  }, [isDarkMode]);

  // テーマ切り替え時の処理
  useEffect(() => {
    if (chart.current) {
      chart.current.applyOptions(themes[isDarkMode ? 'dark' : 'light']);
    }
  }, [isDarkMode]);

  return (
    <>
      <div className="w-full p-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">
            Trading Chart ({isDarkMode ? 'Dark' : 'Light'} Mode)
          </h2>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`px-4 py-2 rounded-md ${
              isDarkMode 
                ? 'bg-gray-700 text-white hover:bg-gray-600' 
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            Toggle Theme
          </button>
        </div>
        <div 
          className="w-full h-[300px]"
          ref={chartContainerRef}
        />
      </div>
    </>
  );
};

export default ThemeSwitchableChart;