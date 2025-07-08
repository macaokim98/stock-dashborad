export interface StockQuote {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    marketCap?: number;
    peRatio?: number;
    high52Week?: number;
    low52Week?: number;
}
export interface MarketIndex {
    name: string;
    symbol: string;
    value: number;
    change: number;
    changePercent: number;
}
export interface StockHistoryPoint {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}
export interface ChartDataPoint {
    timestamp: string;
    datetime: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}
export declare class StockService {
    private yfinanceService;
    private alphaVantageService;
    constructor();
    getMarketOverview(): Promise<MarketIndex[]>;
    getStockQuote(symbol: string): Promise<StockQuote | null>;
    getStockHistory(symbol: string, interval: string, range: string): Promise<StockHistoryPoint[]>;
    searchStocks(query: string): Promise<StockQuote[]>;
    getTopGainers(): Promise<StockQuote[]>;
    getTopLosers(): Promise<StockQuote[]>;
    getChartData(symbol: string, period?: string, interval?: string, startDate?: string, endDate?: string): Promise<ChartDataPoint[]>;
    getCacheStats(): {
        yfinance: {
            keys: number;
            stats: import("node-cache").Stats;
        };
        alphavantage: {
            size: number;
            keys: string[];
        };
    };
    clearCache(): void;
}
//# sourceMappingURL=stockService.d.ts.map