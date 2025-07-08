import React, { useState, useEffect } from 'react';
import './App.css';

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

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
    <div className={`app-design3 ${isDarkMode ? 'dark-mode' : ''}`}
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
        <div className="stats-bar">
          <div className="stat-item">
            <span className="stat-label">Portfolio Value</span>
            <span className="stat-value">$124,567.89</span>
            <span className="stat-change positive">+2.4%</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Day Change</span>
            <span className="stat-value">+$2,890.45</span>
            <span className="stat-change positive">+2.4%</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Gain</span>
            <span className="stat-value">+$24,567.89</span>
            <span className="stat-change positive">+24.5%</span>
          </div>
        </div>
        
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
                <div className="index-item">
                  <div className="index-name">S&P 500</div>
                  <div className="index-value">4,856.84</div>
                  <div className="index-change positive">+1.2%</div>
                </div>
                <div className="index-item">
                  <div className="index-name">NASDAQ</div>
                  <div className="index-value">15,234.67</div>
                  <div className="index-change positive">+0.8%</div>
                </div>
                <div className="index-item">
                  <div className="index-name">Dow Jones</div>
                  <div className="index-value">36,745.31</div>
                  <div className="index-change negative">-0.3%</div>
                </div>
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
                <div className="holding-item">
                  <div className="holding-info">
                    <span className="holding-symbol">AAPL</span>
                    <span className="holding-name">Apple Inc.</span>
                  </div>
                  <div className="holding-data">
                    <span className="holding-price">$195.43</span>
                    <span className="holding-change positive">+2.1%</span>
                  </div>
                </div>
                <div className="holding-item">
                  <div className="holding-info">
                    <span className="holding-symbol">MSFT</span>
                    <span className="holding-name">Microsoft Corp.</span>
                  </div>
                  <div className="holding-data">
                    <span className="holding-price">$421.89</span>
                    <span className="holding-change positive">+1.8%</span>
                  </div>
                </div>
                <div className="holding-item">
                  <div className="holding-info">
                    <span className="holding-symbol">GOOGL</span>
                    <span className="holding-name">Alphabet Inc.</span>
                  </div>
                  <div className="holding-data">
                    <span className="holding-price">$2,834.56</span>
                    <span className="holding-change negative">-0.5%</span>
                  </div>
                </div>
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
