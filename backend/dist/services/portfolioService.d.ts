export interface PortfolioHolding {
    id: string;
    symbol: string;
    shares: number;
    purchasePrice: number;
    purchaseDate: Date;
    currentPrice?: number;
    marketValue?: number;
    gain?: number;
    gainPercent?: number;
}
export interface PortfolioOverview {
    totalValue: number;
    dayChange: number;
    dayChangePercent: number;
    totalGain: number;
    totalGainPercent: number;
    totalCost: number;
    lastUpdated: string;
}
export interface PortfolioHistory {
    date: string;
    value: number;
    change: number;
    changePercent: number;
}
export declare class PortfolioService {
    private mockHoldings;
    getPortfolioOverview(): Promise<PortfolioOverview>;
    getHoldings(): Promise<PortfolioHolding[]>;
    getPortfolioHistory(period: string): Promise<PortfolioHistory[]>;
    addHolding(holding: Omit<PortfolioHolding, 'id'>): Promise<PortfolioHolding>;
    updateHolding(id: string, updates: Partial<PortfolioHolding>): Promise<PortfolioHolding | null>;
    removeHolding(id: string): Promise<boolean>;
    private getPeriodDays;
}
//# sourceMappingURL=portfolioService.d.ts.map