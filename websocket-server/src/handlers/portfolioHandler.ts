import { Socket } from 'socket.io';
import { logger } from '../utils/logger';

export interface PortfolioUpdate {
  totalValue: number;
  dayChange: number;
  dayChangePercent: number;
  totalGain: number;
  totalGainPercent: number;
  holdings: PortfolioHolding[];
  lastUpdated: string;
}

export interface PortfolioHolding {
  symbol: string;
  shares: number;
  currentPrice: number;
  purchasePrice: number;
  marketValue: number;
  gain: number;
  gainPercent: number;
}

export class PortfolioHandler {
  private subscribedClients: Set<string> = new Set();
  private portfolioUpdateInterval?: NodeJS.Timeout;
  private mockPortfolio: PortfolioHolding[] = [
    {
      symbol: 'AAPL',
      shares: 50,
      currentPrice: 195.43,
      purchasePrice: 180.00,
      marketValue: 9771.50,
      gain: 771.50,
      gainPercent: 8.57
    },
    {
      symbol: 'MSFT',
      shares: 25,
      currentPrice: 421.89,
      purchasePrice: 400.00,
      marketValue: 10547.25,
      gain: 547.25,
      gainPercent: 5.47
    },
    {
      symbol: 'GOOGL',
      shares: 5,
      currentPrice: 2834.56,
      purchasePrice: 2900.00,
      marketValue: 14172.80,
      gain: -327.20,
      gainPercent: -2.25
    }
  ];

  constructor() {
    this.startPortfolioUpdates();
  }

  subscribeToPortfolio(socket: Socket) {
    if (this.subscribedClients.has(socket.id)) {
      logger.debug(`Client ${socket.id} already subscribed to portfolio`);
      return;
    }

    this.subscribedClients.add(socket.id);
    socket.join('portfolio');

    // Send initial portfolio data
    const portfolioUpdate = this.generatePortfolioUpdate();
    socket.emit('portfolio_update', portfolioUpdate);

    socket.emit('portfolio_subscription_confirmed', {
      message: 'Successfully subscribed to portfolio updates'
    });

    logger.info(`Client ${socket.id} subscribed to portfolio updates`);
  }

  unsubscribeFromPortfolio(socket: Socket) {
    if (!this.subscribedClients.has(socket.id)) {
      return;
    }

    this.subscribedClients.delete(socket.id);
    socket.leave('portfolio');

    socket.emit('portfolio_unsubscription_confirmed', {
      message: 'Successfully unsubscribed from portfolio updates'
    });

    logger.info(`Client ${socket.id} unsubscribed from portfolio updates`);
  }

  private startPortfolioUpdates() {
    const updateInterval = parseInt(process.env.PORTFOLIO_UPDATE_INTERVAL || '10000');
    
    this.portfolioUpdateInterval = setInterval(() => {
      if (this.subscribedClients.size > 0) {
        this.broadcastPortfolioUpdate();
      }
    }, updateInterval);

    logger.info(`Portfolio updates started (${updateInterval}ms interval)`);
  }

  private stopPortfolioUpdates() {
    if (this.portfolioUpdateInterval) {
      clearInterval(this.portfolioUpdateInterval);
      this.portfolioUpdateInterval = undefined;
      logger.info('Portfolio updates stopped');
    }
  }

  private broadcastPortfolioUpdate() {
    const portfolioUpdate = this.generatePortfolioUpdate();
    
    // Broadcast to all portfolio subscribers
    const io = require('../server').io;
    io.to('portfolio').emit('portfolio_update', portfolioUpdate);

    logger.debug(`Broadcasted portfolio update to ${this.subscribedClients.size} clients`);
  }

  private generatePortfolioUpdate(): PortfolioUpdate {
    // Simulate realistic price movements for holdings
    const updatedHoldings = this.mockPortfolio.map(holding => {
      // Random price variation ±2%
      const priceVariation = (Math.random() - 0.5) * 0.04;
      const newPrice = holding.purchasePrice * (1 + (holding.gainPercent / 100) + priceVariation);
      
      const marketValue = newPrice * holding.shares;
      const gain = marketValue - (holding.purchasePrice * holding.shares);
      const gainPercent = (gain / (holding.purchasePrice * holding.shares)) * 100;

      return {
        ...holding,
        currentPrice: Number(newPrice.toFixed(2)),
        marketValue: Number(marketValue.toFixed(2)),
        gain: Number(gain.toFixed(2)),
        gainPercent: Number(gainPercent.toFixed(2))
      };
    });

    // Calculate portfolio totals
    const totalValue = updatedHoldings.reduce((sum, holding) => sum + holding.marketValue, 0);
    const totalCost = updatedHoldings.reduce((sum, holding) => sum + (holding.purchasePrice * holding.shares), 0);
    const totalGain = totalValue - totalCost;
    const totalGainPercent = (totalGain / totalCost) * 100;

    // Simulate day change (random ±3%)
    const dayChangePercent = (Math.random() - 0.5) * 6;
    const dayChange = totalValue * (dayChangePercent / 100);

    this.mockPortfolio = updatedHoldings;

    return {
      totalValue: Number(totalValue.toFixed(2)),
      dayChange: Number(dayChange.toFixed(2)),
      dayChangePercent: Number(dayChangePercent.toFixed(2)),
      totalGain: Number(totalGain.toFixed(2)),
      totalGainPercent: Number(totalGainPercent.toFixed(2)),
      holdings: updatedHoldings,
      lastUpdated: new Date().toISOString()
    };
  }

  getSubscriptionStats() {
    return {
      subscribedClients: this.subscribedClients.size,
      isUpdateActive: !!this.portfolioUpdateInterval
    };
  }

  // Clean up when server shuts down
  destroy() {
    this.stopPortfolioUpdates();
    this.subscribedClients.clear();
  }
}