/**
 * Command Queue
 *
 * In-memory sequential processing queue for commands.
 * Ensures that commands are processed one at a time to avoid race conditions.
 */

export interface QueuedCommand<T = unknown> {
  id: string;
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
}

export class CommandQueue {
  private queue: QueuedCommand[] = [];
  private isProcessing = false;

  /**
   * Enqueue a command for execution.
   * Returns a promise that resolves when the command completes.
   */
  async enqueue<T>(execute: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const command: QueuedCommand<T> = {
        id: this.generateId(),
        execute,
        resolve: resolve as (value: unknown) => void,
        reject,
      };

      this.queue.push(command as QueuedCommand);
      void this.processQueue();
    });
  }

  /**
   * Get the current queue length.
   */
  getQueueLength(): number {
    return this.queue.length;
  }

  /**
   * Check if the queue is currently processing.
   */
  isBusy(): boolean {
    return this.isProcessing;
  }

  /**
   * Clear all pending commands.
   */
  clear(): void {
    // Reject all pending commands
    for (const command of this.queue) {
      command.reject(new Error('Command queue cleared'));
    }
    this.queue = [];
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const command = this.queue.shift();
      if (!command) continue;

      try {
        const result = await command.execute();
        command.resolve(result);
      } catch (error) {
        command.reject(error instanceof Error ? error : new Error(String(error)));
      }
    }

    this.isProcessing = false;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

// Singleton instance for the application
export const globalCommandQueue = new CommandQueue();
