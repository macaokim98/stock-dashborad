import { Socket } from 'socket.io';
export interface ClientConnection {
    id: string;
    socket: Socket;
    ip: string;
    connectedAt: Date;
    subscribedSymbols: Set<string>;
    isPortfolioSubscribed: boolean;
    isNotificationsSubscribed: boolean;
}
export declare class ConnectionManager {
    private connections;
    private ipConnections;
    private maxConnectionsPerIP;
    addConnection(socket: Socket): boolean;
    removeConnection(socketId: string): void;
    getConnection(socketId: string): ClientConnection | undefined;
    getAllConnections(): ClientConnection[];
    getConnectionCount(): number;
    getConnectionsBySymbol(symbol: string): ClientConnection[];
    getPortfolioSubscriptions(): ClientConnection[];
    getNotificationSubscriptions(): ClientConnection[];
    subscribeToSymbol(socketId: string, symbol: string): void;
    unsubscribeFromSymbol(socketId: string, symbol: string): void;
    setPortfolioSubscription(socketId: string, subscribed: boolean): void;
    setNotificationSubscription(socketId: string, subscribed: boolean): void;
    getStats(): {
        totalConnections: number;
        uniqueIPs: number;
        portfolioSubscriptions: number;
        notificationSubscriptions: number;
        ipStats: {
            ip: string;
            connectionCount: number;
        }[];
        symbolStats: {
            symbol: string;
            subscribers: number;
        }[];
    };
    private canConnect;
    private getClientIP;
}
