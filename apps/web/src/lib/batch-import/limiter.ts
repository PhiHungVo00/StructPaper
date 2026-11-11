/** Runs at most `limit` tasks at the same time; the rest wait in arrival order. */
export interface Limiter {
  run<T>(task: () => Promise<T>, signal?: AbortSignal): Promise<T>;
}

export function abortError(): Error {
  const e = new Error('Đã hủy');
  e.name = 'AbortError';
  return e;
}

export const isAbortError = (e: unknown): boolean =>
  !!e && typeof e === 'object' && ((e as Error).name === 'AbortError' || (e as Error).name === 'CompileAbortError');

export function createLimiter(limit: number): Limiter {
  const max = Math.max(1, Math.floor(limit) || 1);
  let active = 0;
  const waiting: (() => void)[] = [];

  // A finished task hands its slot straight to the next waiter (active stays the same), so a task
  // that arrives in between can never jump the queue and push the count over the limit.
  const release = () => {
    const next = waiting.shift();
    if (next) next();
    else active--;
  };

  return {
    async run<T>(task: () => Promise<T>, signal?: AbortSignal): Promise<T> {
      if (signal?.aborted) throw abortError();
      if (active < max) active++;
      else {
        await new Promise<void>((resolve, reject) => {
          const wake = () => {
            signal?.removeEventListener('abort', onAbort);
            resolve();
          };
          const onAbort = () => {
            const at = waiting.indexOf(wake);
            if (at >= 0) waiting.splice(at, 1);
            reject(abortError());
          };
          waiting.push(wake);
          signal?.addEventListener('abort', onAbort, { once: true });
        });
      }
      try {
        return await task();
      } finally {
        release();
      }
    },
  };
}
