import React, { useState, useEffect } from 'react';
import './App.css';
import { useStockData } from './hooks/useStockData';
import { useWebSocket } from './hooks/useWebSocket';
import LoadingSpinner from './components/LoadingSpinner';
import StockChart from './components/StockChart';
import VolumeIndicator from './components/VolumeIndicator';
import './components/StockChart.css';
import './components/VolumeIndicator.css';

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedStock, setSelectedStock] = useState('AAPL');
  const [showChart, setShowChart] = useState(true);
  const { stocks, marketIndices, portfolioData, loading, error, refreshData } = useStockData();
  const { connected, subscribeToStocks, subscribeToPortfolio, subscribeToNotifications } = useWebSocket();

  useEffect(() => {
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme) {
      setIsDarkMode(JSON.parse(savedTheme));
    }
  }, []);

  useEffect(() => {
    let subscribed = false;
    
    if (connected && !subscribed) {
      console.log('Subscribing to WebSocket data...');
      subscribeToStocks(['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'AMZN']);
      subscribeToPortfolio();
      subscribeToNotifications();
      subscribed = true;
    }
    
    return () => {
      subscribed = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected]); // Intentionally omit function dependencies to prevent infinite loop

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('darkMode', JSON.stringify(newTheme));
  };

  return (
    <div className={`app-design3 ${isDarkMode ? 'dark-mode' : ''}`}>
      <header className="clean-header">
        <div className="brand">
          <h1>StockBase</h1>
          <span className="tagline">Professional Trading Dashboard</span>
        </div>
        <nav className="nav-controls">
          <button className="nav-btn">Portfolio</button>
          <button className="nav-btn">Analytics</button>
          <button className="nav-btn active">Dashboard</button>
          <div className="websocket-status">
            <span className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}>
              {connected ? '🟢' : '🔴'}
            </span>
            <span className="status-text">
              {connected ? 'Live' : 'Offline'}
            </span>
          </div>
          <button className="theme-switch" onClick={toggleTheme}>
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </nav>
      </header>
      
      <main className="clean-main">
        {loading ? (
          <div className="stats-bar">
            <div className="stat-item">
              <LoadingSpinner size="medium" />
            </div>
          </div>
        ) : error ? (
          <div className="stats-bar">
            <div className="stat-item error">
              <span className="error-message">{error}</span>
              <button onClick={refreshData} className="refresh-btn">Retry</button>
            </div>
          </div>
        ) : (
          <div className="stats-bar">
            <div className="stat-item">
              <span className="stat-label">Portfolio Value</span>
              <span className="stat-value">${portfolioData?.totalValue.toLocaleString()}</span>
              <span className={`stat-change ${portfolioData && portfolioData.dayChangePercent >= 0 ? 'positive' : 'negative'}`}>
                {portfolioData && portfolioData.dayChangePercent >= 0 ? '+' : ''}{portfolioData?.dayChangePercent.toFixed(1)}%
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Day Change</span>
              <span className="stat-value">
                {portfolioData && portfolioData.dayChange >= 0 ? '+' : ''}${portfolioData?.dayChange.toLocaleString()}
              </span>
              <span className={`stat-change ${portfolioData && portfolioData.dayChangePercent >= 0 ? 'positive' : 'negative'}`}>
                {portfolioData && portfolioData.dayChangePercent >= 0 ? '+' : ''}{portfolioData?.dayChangePercent.toFixed(1)}%
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Gain</span>
              <span className="stat-value">
                {portfolioData && portfolioData.totalGain >= 0 ? '+' : ''}${portfolioData?.totalGain.toLocaleString()}
              </span>
              <span className={`stat-change ${portfolioData && portfolioData.totalGainPercent >= 0 ? 'positive' : 'negative'}`}>
                {portfolioData && portfolioData.totalGainPercent >= 0 ? '+' : ''}{portfolioData?.totalGainPercent.toFixed(1)}%
              </span>
            </div>
          </div>
        )}
        
        <div className="dashboard-layout">
          <div className="card market-card">
            <div className="card-header">
              <h3>Market Overview</h3>
              <select className="time-selector">
                <option>1D</option>
                <option>1W</option>
                <option>1M</option>
                <option>1Y</option>
              </select>
            </div>
            <div className="card-content">
              <div className="index-grid">
                {marketIndices.map((index) => (
                  <div key={index.symbol} className="index-item">
                    <div className="index-name">{index.name}</div>
                    <div className="index-value">{index.value.toLocaleString()}</div>
                    <div className={`index-change ${index.changePercent >= 0 ? 'positive' : 'negative'}`}>
                      {index.changePercent >= 0 ? '+' : ''}{index.changePercent.toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="card holdings-card">
            <div className="card-header">
              <h3>Top Holdings</h3>
              <button className="view-all">View All</button>
            </div>
            <div className="card-content">
              <div className="holdings-list">
                {stocks.slice(0, 3).map((stock) => (
                  <div key={stock.symbol} className="holding-item">
                    <div className="holding-info">
                      <span className="holding-symbol">{stock.symbol}</span>
                      <span className="holding-name">{stock.name}</span>
                    </div>
                    <div className="holding-data">
                      <div className="holding-price-data">
                        <span className="holding-price">${stock.price.toFixed(2)}</span>
                        <span className={`holding-change ${stock.changePercent >= 0 ? 'positive' : 'negative'}`}>
                          {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(1)}%
                        </span>
                      </div>
                      <VolumeIndicator 
                        volume={1250000} 
                        averageVolume={1000000}
                        className="holding-volume"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="card chart-card">
            <div className="card-header">
              <h3>주식 차트</h3>
              <div className="chart-stock-selector">
                <select 
                  value={selectedStock} 
                  onChange={(e) => setSelectedStock(e.target.value)}
                  className="stock-select"
                >
                  <option value="AAPL">Apple (AAPL)</option>
                  <option value="MSFT">Microsoft (MSFT)</option>
                  <option value="GOOGL">Alphabet (GOOGL)</option>
                  <option value="TSLA">Tesla (TSLA)</option>
                  <option value="AMZN">Amazon (AMZN)</option>
                  <option value="NVDA">NVIDIA (NVDA)</option>
                  <option value="META">Meta (META)</option>
                </select>
                <button 
                  className={`chart-toggle-btn ${showChart ? 'active' : ''}`}
                  onClick={() => setShowChart(!showChart)}
                >
                  {showChart ? '차트 숨기기' : '차트 보기'}
                </button>
              </div>
            </div>
            <div className="card-content">
              {showChart ? (
                <StockChart symbol={selectedStock} height={350} />
              ) : (
                <div className="chart-placeholder">
                  <p>차트가 숨겨져 있습니다. "차트 보기" 버튼을 클릭하세요.</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="card activity-card">
            <div className="card-header">
              <h3>Recent Activity</h3>
              <span className="activity-count">5 transactions</span>
            </div>
            <div className="card-content">
              <div className="activity-list">
                <div className="activity-item">
                  <div className="activity-type buy">BUY</div>
                  <div className="activity-details">
                    <span className="activity-symbol">AAPL</span>
                    <span className="activity-desc">10 shares at $195.43</span>
                  </div>
                  <div className="activity-time">2 hours ago</div>
                </div>
                <div className="activity-item">
                  <div className="activity-type sell">SELL</div>
                  <div className="activity-details">
                    <span className="activity-symbol">TSLA</span>
                    <span className="activity-desc">5 shares at $248.50</span>
                  </div>
                  <div className="activity-time">1 day ago</div>
                </div>
                <div className="activity-item">
                  <div className="activity-type buy">BUY</div>
                  <div className="activity-details">
                    <span className="activity-symbol">MSFT</span>
                    <span className="activity-desc">15 shares at $421.89</span>
                  </div>
                  <div className="activity-time">2 days ago</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
