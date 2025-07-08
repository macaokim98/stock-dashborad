export interface AlphaVantageQuote {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    volume?: number;
    high?: number;
    low?: number;
    open?: number;
}
export interface AlphaVantageTimeSeriesData {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}
export declare class AlphaVantageService {
    private apiKey;
    private baseUrl;
    private cache;
    private cacheTimeout;
    constructor();
    private getCacheKey;
    private getFromCache;
    private setCache;
    getQuote(symbol: string): Promise<AlphaVantageQuote | null>;
    getTimeSeries(symbol: string, interval?: 'daily' | 'weekly' | 'monthly'): Promise<AlphaVantageTimeSeriesData[]>;
    getIntradayData(symbol: string, interval?: '1min' | '5min' | '15min' | '30min' | '60min'): Promise<AlphaVantageTimeSeriesData[]>;
    getCacheStats(): {
        size: number;
        keys: string[];
    };
    clearCache(): void;
}
//# sourceMappingURL=alphaVantageService.d.ts.map