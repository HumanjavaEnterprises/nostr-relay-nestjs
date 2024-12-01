import { ConfigService } from '@nestjs/config';
import { INestApplicationContext } from '@nestjs/common';
import { WsAdapter } from '@nestjs/platform-ws';
import * as WebSocket from 'ws';
import { Config } from '@/config';
import { ConnectionManagerService } from '@/modules/connection-manager/connection-manager.service';
import { IncomingMessage } from 'http';
import { Logger } from '@nestjs/common';

// Basic message types for NIP-42
interface AuthMessage {
  type: 'auth';
  data: {
    challenge: string;
  };
}

interface NostrMessage {
  type: 'nostr';
  data: any;
}

export interface EnhancedWebSocket extends WebSocket {
  id?: string;
  authenticated?: boolean;
  pubkey?: string;
  _request?: IncomingMessage;
  _ip?: string;
}

export class CustomWebSocketAdapter extends WsAdapter {
  private wsServer: WebSocket.Server;
  private readonly appContext: INestApplicationContext;
  protected readonly logger = new Logger(CustomWebSocketAdapter.name);

  constructor(
    app: INestApplicationContext,
    private readonly connectionManager: ConnectionManagerService,
    private readonly configService: ConfigService<Config, true>,
  ) {
    super(app);
    this.appContext = app;
  }

  create(port: number, options: any = {}): any {
    const server = (this.appContext as any).getHttpServer();
    this.wsServer = new WebSocket.Server({
      server,
      ...options,
    });

    // Handle connection event to attach request to socket
    this.wsServer.on('connection', (ws: EnhancedWebSocket, req: IncomingMessage) => {
      // Store both the request and its headers directly on the socket
      ws._request = req;
      (ws as any).upgradeReq = req;

      // Extract and store IP directly
      let ip = 'unknown';
      if (req.headers['x-real-ip']) {
        ip = Array.isArray(req.headers['x-real-ip']) 
          ? req.headers['x-real-ip'][0] 
          : req.headers['x-real-ip'];
      } else if (req.headers['x-forwarded-for']) {
        const forwarded = req.headers['x-forwarded-for'];
        ip = Array.isArray(forwarded)
          ? forwarded[0].split(',')[0].trim()
          : forwarded.split(',')[0].trim();
      } else if (req.socket?.remoteAddress) {
        ip = req.socket.remoteAddress;
      }

      ws._ip = ip;
      
      this.logger.debug('WebSocket connection established', {
        headers: req.headers,
        remoteAddress: req.socket?.remoteAddress,
        assignedIp: ip
      });
    });

    return server;
  }

  bindMessageHandlers(
    client: EnhancedWebSocket,
    handlers: any[],
    transform: any,
  ): void {
    const { messageHandlers } = transform;
    client.on('message', (data: WebSocket.Data) => {
      try {
        const message = JSON.parse(data.toString());
        const messageHandler = messageHandlers.get(message[0]);
        if (messageHandler) {
          messageHandler.callback(client, message);
        }
      } catch (error) {
        console.error('Error handling message:', error);
      }
    });
  }
}
