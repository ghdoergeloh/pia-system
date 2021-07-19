import * as amqp from 'amqplib';

import { MessageQueueClientHelper } from './messageQueueClientHelper';

export class MessageQueueClientConnection {
  protected connection: amqp.Connection | null = null;

  public constructor(
    private readonly options: {
      hostname: string;
      port?: number;
      username: string;
      password: string;
    }
  ) {}

  public isConnected(): boolean {
    return this.connection !== null;
  }

  /**
   * Connects to the message queue host.
   */
  public async connect(waitForAvailability = true): Promise<void> {
    if (this.connection) {
      throw new Error('already connected');
    }

    if (waitForAvailability) {
      await MessageQueueClientHelper.waitForAvailability(this.options);
    }

    this.connection = await amqp.connect({
      hostname: this.options.hostname,
      port: this.options.port,
      username: this.options.username,
      password: this.options.password,
    });
    this.connection.once('close', () => {
      this.connection = null;
    });
  }

  /**
   * Disconnects from the message queue host
   */
  public async disconnect(): Promise<void> {
    if (!this.connection) {
      throw new Error('not connected');
    }

    this.connection.removeAllListeners();
    await this.connection.close();
    this.connection = null;
  }
}