import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: string;
}

interface MarketIndex {
  name: string;
  symbol: string;
  value: number;
  change: number;
  changePercent: number;
  timestamp: string;
}

interface PortfolioUpdate {
  totalValue: number;
  dayChange: number;
  dayChangePercent: number;
  totalGain: number;
  totalGainPercent: number;
  holdings: any[];
  lastUpdated: string;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: Date;
}

export const useWebSocket = () => {
  const [connected, setConnected] = useState(false);
  const [stockQuotes, setStockQuotes] = useState<Map<string, StockQuote>>(new Map());
  const [marketData, setMarketData] = useState<MarketIndex[]>([]);
  const [portfolioUpdate, setPortfolioUpdate] = useState<PortfolioUpdate | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [subscribedSymbols, setSubscribedSymbols] = useState<string[]>([]);
  
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Prevent multiple connections
    if (socketRef.current?.connected) {
      return;
    }

    // Get WebSocket URL from environment variable or fallback to localhost
    const WEBSOCKET_URL = process.env.REACT_APP_WEBSOCKET_URL || 'http://localhost:3002';
    
    // Connect to WebSocket server
    const socket = io(WEBSOCKET_URL, {
      transports: ['websocket', 'polling'],
      forceNew: true
    });

    socketRef.current = socket;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('WebSocket connected:', socket.id);
      setConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      setConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setConnected(false);
    });

    // Data event handlers
    socket.on('stock_quote', (quote: StockQuote) => {
      setStockQuotes(prev => {
        const newMap = new Map(prev);
        newMap.set(quote.symbol, quote);
        return newMap;
      });
    });

    socket.on('market_overview', (data: MarketIndex[]) => {
      setMarketData(data);
    });

    socket.on('portfolio_update', (data: PortfolioUpdate) => {
      setPortfolioUpdate(data);
    });

    socket.on('notification', (notification: Notification) => {
      setNotifications(prev => [notification, ...prev].slice(0, 50)); // Keep last 50 notifications
    });

    // Subscription confirmations
    socket.on('subscription_confirmed', (data) => {
      console.log('Subscription confirmed:', data);
    });

    socket.on('unsubscription_confirmed', (data) => {
      console.log('Unsubscription confirmed:', data);
    });

    // Error handling
    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, []);

  const subscribeToStocks = (symbols: string[]) => {
    if (socketRef.current && connected) {
      socketRef.current.emit('subscribe_to_stocks', symbols);
      setSubscribedSymbols(prev => {
        const newSet = new Set([...prev, ...symbols]);
        return Array.from(newSet);
      });
    }
  };

  const unsubscribeFromStocks = (symbols: string[]) => {
    if (socketRef.current && connected) {
      socketRef.current.emit('unsubscribe_from_stocks', symbols);
      setSubscribedSymbols(prev => prev.filter(s => !symbols.includes(s)));
    }
  };

  const subscribeToPortfolio = () => {
    if (socketRef.current && connected) {
      socketRef.current.emit('subscribe_to_portfolio');
    }
  };

  const unsubscribeFromPortfolio = () => {
    if (socketRef.current && connected) {
      socketRef.current.emit('unsubscribe_from_portfolio');
    }
  };

  const subscribeToNotifications = () => {
    if (socketRef.current && connected) {
      socketRef.current.emit('subscribe_to_notifications');
    }
  };

  const setPriceAlert = (symbol: string, targetPrice: number, condition: 'above' | 'below') => {
    if (socketRef.current && connected) {
      socketRef.current.emit('set_price_alert', {
        symbol,
        targetPrice,
        condition
      });
    }
  };

  const removePriceAlert = (alertId: string) => {
    if (socketRef.current && connected) {
      socketRef.current.emit('remove_price_alert', alertId);
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return {
    connected,
    stockQuotes,
    marketData,
    portfolioUpdate,
    notifications,
    subscribedSymbols,
    subscribeToStocks,
    unsubscribeFromStocks,
    subscribeToPortfolio,
    unsubscribeFromPortfolio,
    subscribeToNotifications,
    setPriceAlert,
    removePriceAlert,
    clearNotifications
  };
};