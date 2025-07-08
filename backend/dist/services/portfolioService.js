"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PortfolioService = void 0;
const logger_1 = require("../utils/logger");
class PortfolioService {
    constructor() {
        this.mockHoldings = [
            {
                id: '1',
                symbol: 'AAPL',
                shares: 50,
                purchasePrice: 150.00,
                purchaseDate: new Date('2023-01-15'),
                currentPrice: 195.43,
                marketValue: 9771.50,
                gain: 2271.50,
                gainPercent: 30.29
            },
            {
                id: '2',
                symbol: 'MSFT',
                shares: 25,
                purchasePrice: 350.00,
                purchaseDate: new Date('2023-02-10'),
                currentPrice: 421.89,
                marketValue: 10547.25,
                gain: 1797.25,
                gainPercent: 20.54
            },
            {
                id: '3',
                symbol: 'GOOGL',
                shares: 10,
                purchasePrice: 2500.00,
                purchaseDate: new Date('2023-03-05'),
                currentPrice: 2834.56,
                marketValue: 28345.60,
                gain: 3345.60,
                gainPercent: 13.38
            }
        ];
    }
    async getPortfolioOverview() {
        try {
            const totalValue = this.mockHoldings.reduce((sum, holding) => sum + (holding.marketValue || 0), 0);
            const totalCost = this.mockHoldings.reduce((sum, holding) => sum + (holding.shares * holding.purchasePrice), 0);
            const totalGain = totalValue - totalCost;
            const totalGainPercent = (totalGain / totalCost) * 100;
            // Mock day change calculation
            const dayChange = totalValue * 0.024; // 2.4% daily change
            const dayChangePercent = 2.4;
            return {
                totalValue,
                dayChange,
                dayChangePercent,
                totalGain,
                totalGainPercent,
                totalCost,
                lastUpdated: new Date().toISOString()
            };
        }
        catch (error) {
            logger_1.logger.error('Error calculating portfolio overview:', error);
            throw error;
        }
    }
    async getHoldings() {
        try {
            return this.mockHoldings;
        }
        catch (error) {
            logger_1.logger.error('Error fetching portfolio holdings:', error);
            throw error;
        }
    }
    async getPortfolioHistory(period) {
        try {
            // Generate mock historical data
            const days = this.getPeriodDays(period);
            const baseValue = 48000;
            const history = [];
            for (let i = days; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const randomChange = (Math.random() - 0.5) * 0.1; // ±5% random change
                const value = baseValue * (1 + randomChange + (days - i) * 0.002); // Slight upward trend
                const change = i === days ? 0 : value - history[history.length - 1]?.value || 0;
                const changePercent = i === days ? 0 : (change / (value - change)) * 100;
                history.push({
                    date: date.toISOString().split('T')[0],
                    value: Number(value.toFixed(2)),
                    change: Number(change.toFixed(2)),
                    changePercent: Number(changePercent.toFixed(2))
                });
            }
            return history;
        }
        catch (error) {
            logger_1.logger.error('Error fetching portfolio history:', error);
            throw error;
        }
    }
    async addHolding(holding) {
        try {
            const newHolding = {
                ...holding,
                id: Date.now().toString()
            };
            this.mockHoldings.push(newHolding);
            logger_1.logger.info(`Added new holding: ${holding.symbol} (${holding.shares} shares)`);
            return newHolding;
        }
        catch (error) {
            logger_1.logger.error('Error adding holding:', error);
            throw error;
        }
    }
    async updateHolding(id, updates) {
        try {
            const index = this.mockHoldings.findIndex(h => h.id === id);
            if (index === -1) {
                return null;
            }
            this.mockHoldings[index] = { ...this.mockHoldings[index], ...updates };
            logger_1.logger.info(`Updated holding: ${this.mockHoldings[index].symbol}`);
            return this.mockHoldings[index];
        }
        catch (error) {
            logger_1.logger.error('Error updating holding:', error);
            throw error;
        }
    }
    async removeHolding(id) {
        try {
            const index = this.mockHoldings.findIndex(h => h.id === id);
            if (index === -1) {
                return false;
            }
            const holding = this.mockHoldings[index];
            this.mockHoldings.splice(index, 1);
            logger_1.logger.info(`Removed holding: ${holding.symbol}`);
            return true;
        }
        catch (error) {
            logger_1.logger.error('Error removing holding:', error);
            throw error;
        }
    }
    getPeriodDays(period) {
        switch (period) {
            case '1day':
                return 1;
            case '1week':
                return 7;
            case '1month':
                return 30;
            case '3months':
                return 90;
            case '6months':
                return 180;
            case '1year':
                return 365;
            default:
                return 30;
        }
    }
}
exports.PortfolioService = PortfolioService;
//# sourceMappingURL=portfolioService.js.map