/**
 * Server Setup
 * Creates and configures HTTP and WebSocket servers
 */

import { createServer as createHttpServer } from 'http';
import { createExpressApp } from './http/app.js';
import { createSocketServer } from './websocket/socket.server.js';
import { log as logger } from '@shared/utils/index.js';

export class Server {
  private httpServer: ReturnType<typeof createHttpServer>;
  private expressApp: ReturnType<typeof createExpressApp>;
  private socketServer: ReturnType<typeof createSocketServer>;
  private port: number;

  constructor(port: number = 3000) {
    this.port = port;
    this.expressApp = createExpressApp();
    this.httpServer = createHttpServer(this.expressApp);
    this.socketServer = createSocketServer(this.httpServer);
  }

  /**
   * Start the server
   */
  public async start(): Promise<void> {
    return new Promise((resolve) => {
      this.httpServer.listen(this.port, () => {
        logger.info(`Server started on port ${this.port}`, {
          port: this.port,
          environment: process.env.NODE_ENV || 'development',
        });
        resolve();
      });
    });
  }

  /**
   * Stop the server gracefully
   */
  public async stop(): Promise<void> {
    logger.info('Shutting down server...');

    // Close Socket.IO server
    await this.socketServer.close();

    // Close HTTP server
    return new Promise((resolve, reject) => {
      this.httpServer.close((err) => {
        if (err) {
          logger.error('Error closing HTTP server', { error: err });
          reject(err);
        } else {
          logger.info('Server stopped successfully');
          resolve();
        }
      });
    });
  }

  /**
   * Get Express app instance
   */
  public getExpressApp() {
    return this.expressApp;
  }

  /**
   * Get HTTP server instance
   */
  public getHttpServer(): ReturnType<typeof createHttpServer> {
    return this.httpServer;
  }

  /**
   * Get Socket.IO server instance
   */
  public getSocketServer() {
    return this.socketServer;
  }

  /**
   * Get server port
   */
  public getPort(): number {
    return this.port;
  }
}

/**
 * Create server instance
 */
export function createServer(port?: number): Server {
  return new Server(port);
}
