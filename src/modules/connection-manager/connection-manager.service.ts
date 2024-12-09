import { Injectable } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { WebSocket } from 'ws';
import { RelayQualityService } from './relay-quality.service';
import { 
  NostrWSServer,
  NostrWSMessage,
  ExtendedWebSocket,
  NostrWSOptions
} from 'nostr-websocket-utils';

interface NostrEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
}

interface AuthEvent {
  id: string;
  pubkey: string;
  sig: string;
}

@Injectable()
export class ConnectionManagerService {
  private readonly wsServer: NostrWSServer;
  public restrictedKinds = new Set([4]);

  constructor(
    private readonly logger: Logger,
    private readonly relayQualityService: RelayQualityService,
  ) {
    const options: NostrWSOptions = {
      logger: this.logger,
      onConnect: this.handleConnect.bind(this),
      onDisconnect: this.handleDisconnect.bind(this),
      onMessage: this.handleMessage.bind(this),
    };
    
    this.wsServer = new NostrWSServer(options);
  }

  private handleConnect(client: ExtendedWebSocket): void {
    if (!client.id) {
      this.logger.error('Cannot register client without ID');
      return;
    }

    // Check relay quality before accepting connection
    if (!this.relayQualityService.isRelayQualityAcceptable(client.id)) {
      this.logger.warn('Rejecting connection from low-quality relay: %s', client.id);
      client.close();
      return;
    }

    this.logger.log('Client connected: %s', client.id);
    
    // Update relay metrics
    this.relayQualityService.updateMetrics(client.id, {
      lastSeen: new Date(),
      responseTime: [0], // Initial connection time
    });
  }

  private handleDisconnect(client: ExtendedWebSocket): void {
    if (client.id) {
      this.logger.log('Client disconnected: %s', client.id);
      
      // Update relay metrics on disconnect
      this.relayQualityService.updateMetrics(client.id, {
        failedConnections: 1,
      });
    }
  }

  private async handleMessage(client: ExtendedWebSocket, message: NostrWSMessage): Promise<void> {
    try {
      const [type, ...data] = message;
      
      switch (type) {
        case 'AUTH':
          await this.handleAuth(client, data[0] as AuthEvent);
          break;
        case 'EVENT':
          await this.handleEvent(client, data[0] as NostrEvent);
          break;
        default:
          this.logger.warn('Unknown message type: %s', type);
      }
    } catch (error) {
      this.logger.error('Error handling message: %s', error);
    }
  }

  private async handleAuth(client: ExtendedWebSocket, event: AuthEvent): Promise<void> {
    try {
      // Verify the auth event using nostr-tools or similar
      const isValid = await this.verifyAuthEvent(event);
      if (isValid) {
        client.authenticated = true;
        client.pubkey = event.pubkey;
        this.logger.log('Client authenticated: %s', client.id);
      }
    } catch (error) {
      this.logger.error('Error handling auth: %s', error);
    }
  }

  private async handleEvent(client: ExtendedWebSocket, event: NostrEvent): Promise<void> {
    try {
      // Verify the event signature using nostr-tools
      const isValid = await this.verifyNostrEvent(event);
      if (!isValid) {
        this.logger.warn('Invalid event signature from client: %s', client.id);
        return;
      }

      // Check if event kind is restricted and requires authentication
      if (this.restrictedKinds.has(event.kind) && !client.authenticated) {
        this.logger.warn('Unauthorized event kind %d from client: %s', event.kind, client.id);
        return;
      }

      // Broadcast event to other clients
      this.broadcast(event, client.id);
      
    } catch (error) {
      this.logger.error('Error handling event: %s', error);
    }
  }

  private async verifyAuthEvent(event: AuthEvent): Promise<boolean> {
    // TODO: Implement auth verification using nostr-tools
    return true;
  }

  private async verifyNostrEvent(event: NostrEvent): Promise<boolean> {
    // TODO: Implement event verification using nostr-tools
    return true;
  }

  broadcast(event: NostrEvent, excludeClientId?: string): void {
    this.wsServer.broadcast(['EVENT', event], excludeClientId);
  }

  getConnection(id: string): ExtendedWebSocket | undefined {
    return this.wsServer.getClient(id);
  }

  getAllConnections(): Map<string, ExtendedWebSocket> {
    return this.wsServer.getClients();
  }

  closeConnection(client: ExtendedWebSocket, code?: number, reason?: string): void {
    this.wsServer.closeClient(client, code, reason);
  }
}
