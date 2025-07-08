import { EventEmitter } from 'events';
export interface StockQuote {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    timestamp: string;
}
export interface MarketIndex {
    name: string;
    symbol: string;
    value: number;
    change: number;
    changePercent: number;
    timestamp: string;
}
export declare class StockDataStreamer extends EventEmitter {
    private intervals;
    private subscribedSymbols;
    private marketDataInterval?;
    private isRunning;
    private yfinanceService;
    constructor();
    start(): void;
    stop(): void;
    subscribeToSymbol(symbol: string): void;
    unsubscribeFromSymbol(symbol: string): void;
    getSubscribedSymbols(): string[];
    private startMarketDataStream;
    private startSymbolStream;
    private fetchMarketOverview;
    private fetchStockQuote;
}
