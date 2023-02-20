// cached promise by key for in-flight request handling
export function synchronizedBy<T>(target: () => Promise<T>): (cacheKey: string) => Promise<T>;
export function synchronizedBy<A1, T>(target: (arg1: A1) => Promise<T>): (cacheKey: string, arg1: A1) => Promise<T>;
export function synchronizedBy<A1, A2, T>(target: (arg1: A1, arg2: A2) => Promise<T>): (cacheKey: string, arg1: A1, arg2: A2) => Promise<T>;
export function synchronizedBy<A, T>(target: (...args: A[]) => Promise<T>): (cacheKey: string, ...args: A[]) => Promise<T> {
  const mutexCache: { [cacheKey: string]: Promise<T> } = {};

  return async function (cacheKey: string, ...params: A[]) {
    // eslint-disable-next-line @typescript-eslint/ban-types, @typescript-eslint/no-empty-function
    let resolveMutexPromise: Function = () => {};
    // eslint-disable-next-line @typescript-eslint/ban-types, @typescript-eslint/no-empty-function
    let rejectMutexPromise: Function = () => {};

    if (!mutexCache[cacheKey]) {
      mutexCache[cacheKey] = new Promise<T>(function (this: Promise<T>, resolve, reject) {
        resolveMutexPromise = resolve.bind(this);
        rejectMutexPromise = reject.bind(this);
      });

      try {
        const ret = await target(...params);

        resolveMutexPromise(ret);
      } catch (err) {
        rejectMutexPromise(err);
      }
    }

    try {
      const value = await mutexCache[cacheKey];
      // rm from cache again
      delete mutexCache[cacheKey];
      return value;
    } catch (error) {
      // rm from cache again
      delete mutexCache[cacheKey];
      throw error;
    }
  };
}
