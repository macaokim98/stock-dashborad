import { Socket } from 'socket.io';
import { logger } from '../utils/logger';

export interface ClientConnection {
  id: string;
  socket: Socket;
  ip: string;
  connectedAt: Date;
  subscribedSymbols: Set<string>;
  isPortfolioSubscribed: boolean;
  isNotificationsSubscribed: boolean;
}

export class ConnectionManager {
  private connections: Map<string, ClientConnection> = new Map();
  private ipConnections: Map<string, Set<string>> = new Map();
  private maxConnectionsPerIP = parseInt(process.env.MAX_CONNECTIONS_PER_IP || '50');

  addConnection(socket: Socket): boolean {
    const clientIP = this.getClientIP(socket);
    
    // Check IP connection limit
    if (!this.canConnect(clientIP)) {
      logger.warn(`Connection limit exceeded for IP: ${clientIP}`);
      socket.emit('error', { message: 'Connection limit exceeded' });
      socket.disconnect();
      return false;
    }

    const connection: ClientConnection = {
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
    this.ipConnections.get(clientIP)!.add(socket.id);

    logger.info(`Connection added: ${socket.id} from ${clientIP} (Total: ${this.connections.size})`);
    return true;
  }

  removeConnection(socketId: string): void {
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

    logger.info(`Connection removed: ${socketId} from ${clientIP} (Total: ${this.connections.size})`);
  }

  getConnection(socketId: string): ClientConnection | undefined {
    return this.connections.get(socketId);
  }

  getAllConnections(): ClientConnection[] {
    return Array.from(this.connections.values());
  }

  getConnectionCount(): number {
    return this.connections.size;
  }

  getConnectionsBySymbol(symbol: string): ClientConnection[] {
    return Array.from(this.connections.values()).filter(
      conn => conn.subscribedSymbols.has(symbol)
    );
  }

  getPortfolioSubscriptions(): ClientConnection[] {
    return Array.from(this.connections.values()).filter(
      conn => conn.isPortfolioSubscribed
    );
  }

  getNotificationSubscriptions(): ClientConnection[] {
    return Array.from(this.connections.values()).filter(
      conn => conn.isNotificationsSubscribed
    );
  }

  subscribeToSymbol(socketId: string, symbol: string): void {
    const connection = this.connections.get(socketId);
    if (connection) {
      connection.subscribedSymbols.add(symbol);
      logger.debug(`${socketId} subscribed to ${symbol}`);
    }
  }

  unsubscribeFromSymbol(socketId: string, symbol: string): void {
    const connection = this.connections.get(socketId);
    if (connection) {
      connection.subscribedSymbols.delete(symbol);
      logger.debug(`${socketId} unsubscribed from ${symbol}`);
    }
  }

  setPortfolioSubscription(socketId: string, subscribed: boolean): void {
    const connection = this.connections.get(socketId);
    if (connection) {
      connection.isPortfolioSubscribed = subscribed;
      logger.debug(`${socketId} portfolio subscription: ${subscribed}`);
    }
  }

  setNotificationSubscription(socketId: string, subscribed: boolean): void {
    const connection = this.connections.get(socketId);
    if (connection) {
      connection.isNotificationsSubscribed = subscribed;
      logger.debug(`${socketId} notification subscription: ${subscribed}`);
    }
  }

  getStats() {
    const ipStats = Array.from(this.ipConnections.entries()).map(([ip, connections]) => ({
      ip,
      connectionCount: connections.size
    }));

    const symbolStats = new Map<string, number>();
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

  private canConnect(ip: string): boolean {
    const ipConnections = this.ipConnections.get(ip);
    return !ipConnections || ipConnections.size < this.maxConnectionsPerIP;
  }

  private getClientIP(socket: Socket): string {
    return socket.handshake.headers['x-forwarded-for'] as string ||
           socket.handshake.headers['x-real-ip'] as string ||
           socket.handshake.address ||
           'unknown';
  }
}