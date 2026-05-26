/**
 * Tiny, typed event emitter used by the public board instance.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export class Emitter<EventMap> {
  private listeners: Partial<{ [K in keyof EventMap]: EventMap[K][] }> = {};

  on<K extends keyof EventMap>(event: K, cb: EventMap[K]): void {
    let list = this.listeners[event];
    if (!list) {
      list = [] as EventMap[K][];
      this.listeners[event] = list;
    }
    list.push(cb);
  }

  off<K extends keyof EventMap>(event: K, cb: EventMap[K]): void {
    const list = this.listeners[event];
    if (!list) return;
    const i = list.indexOf(cb);
    if (i >= 0) list.splice(i, 1);
  }

  emit<K extends keyof EventMap>(
    event: K,
    ...args: EventMap[K] extends (...a: infer A) => any ? A : never[]
  ): void {
    const list = this.listeners[event];
    if (!list) return;
    for (const cb of list.slice()) {
      try {
        (cb as (...a: unknown[]) => void)(...(args as unknown[]));
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[chess-ai/design] listener error:', err);
      }
    }
  }

  clear(): void {
    this.listeners = {};
  }
}
