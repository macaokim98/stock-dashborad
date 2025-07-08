import { Socket } from 'socket.io';
export interface PriceAlert {
    id: string;
    symbol: string;
    targetPrice: number;
    condition: 'above' | 'below';
    clientId: string;
    createdAt: Date;
    isActive: boolean;
}
export interface Notification {
    id: string;
    type: 'price_alert' | 'market_news' | 'portfolio_alert';
    title: string;
    message: string;
    data?: any;
    timestamp: Date;
    clientId: string;
}
export declare class NotificationHandler {
    private subscribedClients;
    private priceAlerts;
    private clientAlerts;
    subscribeToNotifications(socket: Socket): void;
    unsubscribeFromNotifications(socket: Socket): void;
    setPriceAlert(socket: Socket, data: {
        symbol: string;
        targetPrice: number;
        condition: 'above' | 'below';
    }): void;
    removePriceAlert(socket: Socket, alertId: string): void;
    checkPriceAlerts(symbol: string, currentPrice: number): void;
    private triggerPriceAlert;
    sendNotification(clientId: string, notification: Notification): void;
    broadcastMarketNews(title: string, message: string, data?: any): void;
    getStats(): {
        subscribedClients: number;
        totalAlerts: number;
        activeAlerts: number;
        alertsBySymbol: {
            symbol: string;
            alertCount: number;
        }[];
    };
    private getAlertsBySymbol;
    cleanup(clientId: string): void;
}
