import { Socket } from 'socket.io';
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
export declare class PortfolioHandler {
    private subscribedClients;
    private portfolioUpdateInterval?;
    private mockPortfolio;
    constructor();
    subscribeToPortfolio(socket: Socket): void;
    unsubscribeFromPortfolio(socket: Socket): void;
    private startPortfolioUpdates;
    private stopPortfolioUpdates;
    private broadcastPortfolioUpdate;
    private generatePortfolioUpdate;
    getSubscriptionStats(): {
        subscribedClients: number;
        isUpdateActive: boolean;
    };
    destroy(): void;
}
