import { Socket } from 'socket.io';
import { StockDataStreamer, StockQuote, MarketIndex } from '../services/stockDataStreamer';
import { logger } from '../utils/logger';

export class RealTimeStockHandler {
  private stockDataStreamer: StockDataStreamer;
  private clientSubscriptions: Map<string, Set<string>> = new Map();

  constructor(stockDataStreamer: StockDataStreamer) {
    this.stockDataStreamer = stockDataStreamer;
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Listen for stock updates
    this.stockDataStreamer.on('stock_update', (quote: StockQuote) => {
      this.broadcastStockUpdate(quote);
    });

    // Listen for market data updates
    this.stockDataStreamer.on('market_data', (marketData: MarketIndex[]) => {
      this.broadcastMarketData(marketData);
    });
  }

  subscribeToStocks(socket: Socket, symbols: string[]) {
    if (!Array.isArray(symbols) || symbols.length === 0) {
      socket.emit('error', { message: 'Invalid symbols array' });
      return;
    }

    const validSymbols = symbols
      .map(s => s.toUpperCase())
      .filter(s => /^[A-Z]{1,5}$/.test(s));

    if (validSymbols.length === 0) {
      socket.emit('error', { message: 'No valid symbols provided' });
      return;
    }

    // Get current subscriptions for this client
    let currentSubscriptions = this.clientSubscriptions.get(socket.id);
    if (!currentSubscriptions) {
      currentSubscriptions = new Set();
      this.clientSubscriptions.set(socket.id, currentSubscriptions);
    }

    // Add new subscriptions
    validSymbols.forEach(symbol => {
      if (!currentSubscriptions!.has(symbol)) {
        currentSubscriptions!.add(symbol);
        this.stockDataStreamer.subscribeToSymbol(symbol);
        logger.debug(`Client ${socket.id} subscribed to ${symbol}`);
      }
    });

    // Join socket rooms for efficient broadcasting
    validSymbols.forEach(symbol => {
      socket.join(`stock:${symbol}`);
    });

    // Send confirmation
    socket.emit('subscription_confirmed', {
      symbols: validSymbols,
      message: `Subscribed to ${validSymbols.length} symbols`
    });

    logger.info(`Client ${socket.id} subscribed to stocks: ${validSymbols.join(', ')}`);
  }

  unsubscribeFromStocks(socket: Socket, symbols: string[]) {
    if (!Array.isArray(symbols) || symbols.length === 0) {
      socket.emit('error', { message: 'Invalid symbols array' });
      return;
    }

    const validSymbols = symbols
      .map(s => s.toUpperCase())
      .filter(s => /^[A-Z]{1,5}$/.test(s));

    const currentSubscriptions = this.clientSubscriptions.get(socket.id);
    if (!currentSubscriptions) {
      socket.emit('error', { message: 'No active subscriptions found' });
      return;
    }

    // Remove subscriptions
    validSymbols.forEach(symbol => {
      if (currentSubscriptions.has(symbol)) {
        currentSubscriptions.delete(symbol);
        socket.leave(`stock:${symbol}`);
        
        // Check if any other clients are still subscribed to this symbol
        const hasOtherSubscribers = Array.from(this.clientSubscriptions.values())
          .some(subscriptions => subscriptions.has(symbol));
        
        if (!hasOtherSubscribers) {
          this.stockDataStreamer.unsubscribeFromSymbol(symbol);
        }
        
        logger.debug(`Client ${socket.id} unsubscribed from ${symbol}`);
      }
    });

    // Clean up empty subscription set
    if (currentSubscriptions.size === 0) {
      this.clientSubscriptions.delete(socket.id);
    }

    // Send confirmation
    socket.emit('unsubscription_confirmed', {
      symbols: validSymbols,
      message: `Unsubscribed from ${validSymbols.length} symbols`
    });

    logger.info(`Client ${socket.id} unsubscribed from stocks: ${validSymbols.join(', ')}`);
  }

  unsubscribeFromAll(socket: Socket) {
    const currentSubscriptions = this.clientSubscriptions.get(socket.id);
    if (!currentSubscriptions || currentSubscriptions.size === 0) {
      return;
    }

    const symbols = Array.from(currentSubscriptions);
    this.unsubscribeFromStocks(socket, symbols);
  }

  private broadcastStockUpdate(quote: StockQuote) {
    // Broadcast to all clients subscribed to this stock
    const room = `stock:${quote.symbol}`;
    
    // Using socket.io's built-in room broadcasting
    const io = require('../server').io;
    io.to(room).emit('stock_quote', quote);

    logger.debug(`Broadcasted ${quote.symbol} update to room ${room}: $${quote.price} (${quote.changePercent > 0 ? '+' : ''}${quote.changePercent}%)`);
  }

  private broadcastMarketData(marketData: MarketIndex[]) {
    // Broadcast market data to all connected clients
    const io = require('../server').io;
    io.emit('market_overview', marketData);

    logger.debug(`Broadcasted market data update to all clients`);
  }

  getSubscriptionStats() {
    const symbolCounts = new Map<string, number>();
    
    this.clientSubscriptions.forEach(subscriptions => {
      subscriptions.forEach(symbol => {
        symbolCounts.set(symbol, (symbolCounts.get(symbol) || 0) + 1);
      });
    });

    return {
      totalClients: this.clientSubscriptions.size,
      totalSubscriptions: Array.from(this.clientSubscriptions.values())
        .reduce((sum, subs) => sum + subs.size, 0),
      symbolSubscriptions: Array.from(symbolCounts.entries()).map(([symbol, count]) => ({
        symbol,
        subscribers: count
      }))
    };
  }
}