import NodeCache from 'node-cache';
export interface YFinanceQuote {
    symbol: string;
    regularMarketPrice: number;
    regularMarketChange: number;
    regularMarketChangePercent: number;
    regularMarketVolume: number;
    marketCap?: number;
    trailingPE?: number;
    fiftyTwoWeekHigh?: number;
    fiftyTwoWeekLow?: number;
    shortName?: string;
    longName?: string;
}
export interface YFinanceHistoricalData {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}
export declare class YFinanceService {
    private cache;
    private baseUrl;
    private quoteSummaryUrl;
    private searchUrl;
    private lastRequestTime;
    private minRequestInterval;
    constructor();
    private throttleRequest;
    getQuote(symbol: string): Promise<YFinanceQuote | null>;
    getMultipleQuotes(symbols: string[]): Promise<Map<string, YFinanceQuote>>;
    getHistoricalData(symbol: string, period?: string, interval?: string): Promise<YFinanceHistoricalData[]>;
    searchSymbols(query: string): Promise<Array<{
        symbol: string;
        name: string;
        type: string;
    }>>;
    getMarketIndices(): Promise<Map<string, YFinanceQuote>>;
    private getPeriodTimestamp;
    private getYearStartTimestamp;
    getCacheStats(): {
        keys: number;
        stats: NodeCache.Stats;
    };
    clearCache(): void;
}
//# sourceMappingURL=yfinanceService.d.ts.map