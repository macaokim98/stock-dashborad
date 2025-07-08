"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationHandler = void 0;
const uuid_1 = require("uuid");
const logger_1 = require("../utils/logger");
class NotificationHandler {
    constructor() {
        this.subscribedClients = new Set();
        this.priceAlerts = new Map();
        this.clientAlerts = new Map();
    }
    subscribeToNotifications(socket) {
        if (this.subscribedClients.has(socket.id)) {
            logger_1.logger.debug(`Client ${socket.id} already subscribed to notifications`);
            return;
        }
        this.subscribedClients.add(socket.id);
        socket.join('notifications');
        // Initialize client alerts tracking
        if (!this.clientAlerts.has(socket.id)) {
            this.clientAlerts.set(socket.id, new Set());
        }
        socket.emit('notification_subscription_confirmed', {
            message: 'Successfully subscribed to notifications'
        });
        // Send welcome notification
        this.sendNotification(socket.id, {
            id: (0, uuid_1.v4)(),
            type: 'market_news',
            title: 'Welcome to Stock Dashboard',
            message: 'You are now subscribed to real-time notifications',
            timestamp: new Date(),
            clientId: socket.id
        });
        logger_1.logger.info(`Client ${socket.id} subscribed to notifications`);
    }
    unsubscribeFromNotifications(socket) {
        if (!this.subscribedClients.has(socket.id)) {
            return;
        }
        this.subscribedClients.delete(socket.id);
        socket.leave('notifications');
        // Remove all alerts for this client
        const clientAlertIds = this.clientAlerts.get(socket.id);
        if (clientAlertIds) {
            clientAlertIds.forEach(alertId => {
                this.priceAlerts.delete(alertId);
            });
            this.clientAlerts.delete(socket.id);
        }
        socket.emit('notification_unsubscription_confirmed', {
            message: 'Successfully unsubscribed from notifications'
        });
        logger_1.logger.info(`Client ${socket.id} unsubscribed from notifications`);
    }
    setPriceAlert(socket, data) {
        const { symbol, targetPrice, condition } = data;
        // Validate input
        if (!symbol || !targetPrice || !condition) {
            socket.emit('error', { message: 'Invalid price alert data' });
            return;
        }
        if (!/^[A-Z]{1,5}$/.test(symbol.toUpperCase())) {
            socket.emit('error', { message: 'Invalid symbol format' });
            return;
        }
        if (targetPrice <= 0) {
            socket.emit('error', { message: 'Target price must be positive' });
            return;
        }
        if (!['above', 'below'].includes(condition)) {
            socket.emit('error', { message: 'Condition must be "above" or "below"' });
            return;
        }
        const alertId = (0, uuid_1.v4)();
        const alert = {
            id: alertId,
            symbol: symbol.toUpperCase(),
            targetPrice,
            condition,
            clientId: socket.id,
            createdAt: new Date(),
            isActive: true
        };
        this.priceAlerts.set(alertId, alert);
        // Track client's alerts
        let clientAlerts = this.clientAlerts.get(socket.id);
        if (!clientAlerts) {
            clientAlerts = new Set();
            this.clientAlerts.set(socket.id, clientAlerts);
        }
        clientAlerts.add(alertId);
        socket.emit('price_alert_created', {
            alertId,
            message: `Price alert set for ${symbol} ${condition} $${targetPrice}`
        });
        logger_1.logger.info(`Price alert created: ${socket.id} - ${symbol} ${condition} $${targetPrice}`);
    }
    removePriceAlert(socket, alertId) {
        const alert = this.priceAlerts.get(alertId);
        if (!alert) {
            socket.emit('error', { message: 'Price alert not found' });
            return;
        }
        if (alert.clientId !== socket.id) {
            socket.emit('error', { message: 'You can only remove your own alerts' });
            return;
        }
        this.priceAlerts.delete(alertId);
        // Remove from client's alert tracking
        const clientAlerts = this.clientAlerts.get(socket.id);
        if (clientAlerts) {
            clientAlerts.delete(alertId);
        }
        socket.emit('price_alert_removed', {
            alertId,
            message: 'Price alert removed successfully'
        });
        logger_1.logger.info(`Price alert removed: ${socket.id} - ${alertId}`);
    }
    checkPriceAlerts(symbol, currentPrice) {
        const alertsToTrigger = [];
        this.priceAlerts.forEach(alert => {
            if (alert.symbol === symbol && alert.isActive) {
                const shouldTrigger = (alert.condition === 'above' && currentPrice >= alert.targetPrice) ||
                    (alert.condition === 'below' && currentPrice <= alert.targetPrice);
                if (shouldTrigger) {
                    alertsToTrigger.push(alert);
                }
            }
        });
        // Trigger alerts
        alertsToTrigger.forEach(alert => {
            this.triggerPriceAlert(alert, currentPrice);
        });
    }
    triggerPriceAlert(alert, currentPrice) {
        // Mark alert as inactive to prevent re-triggering
        alert.isActive = false;
        const notification = {
            id: (0, uuid_1.v4)(),
            type: 'price_alert',
            title: 'Price Alert Triggered',
            message: `${alert.symbol} has reached $${currentPrice.toFixed(2)} (${alert.condition} $${alert.targetPrice})`,
            data: {
                symbol: alert.symbol,
                targetPrice: alert.targetPrice,
                currentPrice,
                condition: alert.condition,
                alertId: alert.id
            },
            timestamp: new Date(),
            clientId: alert.clientId
        };
        this.sendNotification(alert.clientId, notification);
        logger_1.logger.info(`Price alert triggered: ${alert.symbol} ${alert.condition} $${alert.targetPrice} (current: $${currentPrice})`);
    }
    sendNotification(clientId, notification) {
        const io = require('../server').io;
        // Send to specific client
        io.to(clientId).emit('notification', notification);
        logger_1.logger.debug(`Notification sent to ${clientId}: ${notification.title}`);
    }
    broadcastMarketNews(title, message, data) {
        if (this.subscribedClients.size === 0) {
            return;
        }
        const notification = {
            id: (0, uuid_1.v4)(),
            type: 'market_news',
            title,
            message,
            data,
            timestamp: new Date(),
            clientId: 'broadcast'
        };
        const io = require('../server').io;
        io.to('notifications').emit('notification', notification);
        logger_1.logger.info(`Market news broadcasted: ${title}`);
    }
    getStats() {
        const activeAlerts = Array.from(this.priceAlerts.values()).filter(alert => alert.isActive);
        return {
            subscribedClients: this.subscribedClients.size,
            totalAlerts: this.priceAlerts.size,
            activeAlerts: activeAlerts.length,
            alertsBySymbol: this.getAlertsBySymbol(activeAlerts)
        };
    }
    getAlertsBySymbol(alerts) {
        const symbolCounts = new Map();
        alerts.forEach(alert => {
            symbolCounts.set(alert.symbol, (symbolCounts.get(alert.symbol) || 0) + 1);
        });
        return Array.from(symbolCounts.entries()).map(([symbol, count]) => ({
            symbol,
            alertCount: count
        }));
    }
    // Clean up when client disconnects
    cleanup(clientId) {
        const clientAlerts = this.clientAlerts.get(clientId);
        if (clientAlerts) {
            clientAlerts.forEach(alertId => {
                this.priceAlerts.delete(alertId);
            });
            this.clientAlerts.delete(clientId);
        }
    }
}
exports.NotificationHandler = NotificationHandler;
//# sourceMappingURL=notificationHandler.js.map