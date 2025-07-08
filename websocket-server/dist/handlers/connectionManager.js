"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionManager = void 0;
const logger_1 = require("../utils/logger");
class ConnectionManager {
    constructor() {
        this.connections = new Map();
        this.ipConnections = new Map();
        this.maxConnectionsPerIP = parseInt(process.env.MAX_CONNECTIONS_PER_IP || '50');
    }
    addConnection(socket) {
        const clientIP = this.getClientIP(socket);
        // Check IP connection limit
        if (!this.canConnect(clientIP)) {
            logger_1.logger.warn(`Connection limit exceeded for IP: ${clientIP}`);
            socket.emit('error', { message: 'Connection limit exceeded' });
            socket.disconnect();
            return false;
        }
        const connection = {
            id: socket.id,
            socket,
            ip: clientIP,
            connectedAt: new Date(),
            subscribedSymbols: new Set(),
            isPortfolioSubscribed: false,
            isNotificationsSubscribed: false
        };
        this.connections.set(socket.id, connection);
        // Track IP connections
        if (!this.ipConnections.has(clientIP)) {
            this.ipConnections.set(clientIP, new Set());
        }
        this.ipConnections.get(clientIP).add(socket.id);
        logger_1.logger.info(`Connection added: ${socket.id} from ${clientIP} (Total: ${this.connections.size})`);
        return true;
    }
    removeConnection(socketId) {
        const connection = this.connections.get(socketId);
        if (!connection) {
            return;
        }
        const clientIP = connection.ip;
        // Remove from connections
        this.connections.delete(socketId);
        // Remove from IP tracking
        const ipConnections = this.ipConnections.get(clientIP);
        if (ipConnections) {
            ipConnections.delete(socketId);
            if (ipConnections.size === 0) {
                this.ipConnections.delete(clientIP);
            }
        }
        logger_1.logger.info(`Connection removed: ${socketId} from ${clientIP} (Total: ${this.connections.size})`);
    }
    getConnection(socketId) {
        return this.connections.get(socketId);
    }
    getAllConnections() {
        return Array.from(this.connections.values());
    }
    getConnectionCount() {
        return this.connections.size;
    }
    getConnectionsBySymbol(symbol) {
        return Array.from(this.connections.values()).filter(conn => conn.subscribedSymbols.has(symbol));
    }
    getPortfolioSubscriptions() {
        return Array.from(this.connections.values()).filter(conn => conn.isPortfolioSubscribed);
    }
    getNotificationSubscriptions() {
        return Array.from(this.connections.values()).filter(conn => conn.isNotificationsSubscribed);
    }
    subscribeToSymbol(socketId, symbol) {
        const connection = this.connections.get(socketId);
        if (connection) {
            connection.subscribedSymbols.add(symbol);
            logger_1.logger.debug(`${socketId} subscribed to ${symbol}`);
        }
    }
    unsubscribeFromSymbol(socketId, symbol) {
        const connection = this.connections.get(socketId);
        if (connection) {
            connection.subscribedSymbols.delete(symbol);
            logger_1.logger.debug(`${socketId} unsubscribed from ${symbol}`);
        }
    }
    setPortfolioSubscription(socketId, subscribed) {
        const connection = this.connections.get(socketId);
        if (connection) {
            connection.isPortfolioSubscribed = subscribed;
            logger_1.logger.debug(`${socketId} portfolio subscription: ${subscribed}`);
        }
    }
    setNotificationSubscription(socketId, subscribed) {
        const connection = this.connections.get(socketId);
        if (connection) {
            connection.isNotificationsSubscribed = subscribed;
            logger_1.logger.debug(`${socketId} notification subscription: ${subscribed}`);
        }
    }
    getStats() {
        const ipStats = Array.from(this.ipConnections.entries()).map(([ip, connections]) => ({
            ip,
            connectionCount: connections.size
        }));
        const symbolStats = new Map();
        this.connections.forEach(conn => {
            conn.subscribedSymbols.forEach(symbol => {
                symbolStats.set(symbol, (symbolStats.get(symbol) || 0) + 1);
            });
        });
        return {
            totalConnections: this.connections.size,
            uniqueIPs: this.ipConnections.size,
            portfolioSubscriptions: this.getPortfolioSubscriptions().length,
            notificationSubscriptions: this.getNotificationSubscriptions().length,
            ipStats,
            symbolStats: Array.from(symbolStats.entries()).map(([symbol, count]) => ({
                symbol,
                subscribers: count
            }))
        };
    }
    canConnect(ip) {
        const ipConnections = this.ipConnections.get(ip);
        return !ipConnections || ipConnections.size < this.maxConnectionsPerIP;
    }
    getClientIP(socket) {
        return socket.handshake.headers['x-forwarded-for'] ||
            socket.handshake.headers['x-real-ip'] ||
            socket.handshake.address ||
            'unknown';
    }
}
exports.ConnectionManager = ConnectionManager;
//# sourceMappingURL=connectionManager.js.map