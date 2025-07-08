import React, { useState, useEffect } from 'react';
import './App.css';
import { useStockData } from './hooks/useStockData';
import LoadingSpinner from './components/LoadingSpinner';

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { stocks, marketIndices, portfolioData, loading, error, refreshData } = useStockData();

  useEffect(() => {
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme) {
      setIsDarkMode(JSON.parse(savedTheme));
    }
  }, []);

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
                      <span className="holding-price">${stock.price.toFixed(2)}</span>
                      <span className={`holding-change ${stock.changePercent >= 0 ? 'positive' : 'negative'}`}>
                        {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="card chart-card">
            <div className="card-header">
              <h3>Portfolio Performance</h3>
              <div className="chart-controls">
                <button className="chart-btn active">Line</button>
                <button className="chart-btn">Area</button>
                <button className="chart-btn">Candle</button>
              </div>
            </div>
            <div className="card-content">
              <div className="chart-container">
                <div className="chart-placeholder">
                  <div className="chart-line"></div>
                  <div className="chart-points">
                    <div className="point" style={{left: '10%', bottom: '20%'}}></div>
                    <div className="point" style={{left: '30%', bottom: '40%'}}></div>
                    <div className="point" style={{left: '50%', bottom: '60%'}}></div>
                    <div className="point" style={{left: '70%', bottom: '80%'}}></div>
                    <div className="point" style={{left: '90%', bottom: '70%'}}></div>
                  </div>
                </div>
              </div>
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
