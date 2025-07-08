import { Socket } from 'socket.io';
import { StockDataStreamer } from '../services/stockDataStreamer';
export declare class RealTimeStockHandler {
    private stockDataStreamer;
    private clientSubscriptions;
    constructor(stockDataStreamer: StockDataStreamer);
    private setupEventListeners;
    subscribeToStocks(socket: Socket, symbols: string[]): void;
    unsubscribeFromStocks(socket: Socket, symbols: string[]): void;
    unsubscribeFromAll(socket: Socket): void;
    private broadcastStockUpdate;
    private broadcastMarketData;
    getSubscriptionStats(): {
        totalClients: number;
        totalSubscriptions: number;
        symbolSubscriptions: {
            symbol: string;
            subscribers: number;
        }[];
    };
}
