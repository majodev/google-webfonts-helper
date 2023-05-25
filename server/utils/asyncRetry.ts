import * as Bluebird from "bluebird";
import * as _ from "lodash";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function asyncRetry<T>(fn: () => Promise<T>, options: { retries: number }, errors: any[] = []): Promise<T> {
  let t: T;
  try {
    t = await fn();
  } catch (e) {
    if (errors.length >= options.retries) {
      throw new AggregateError(
        _.unionBy([...errors, e], "message"),
        `asyncRetry: maximal retries exceeded. retries=${options.retries} errors=${errors.length}`
      );
    }

    // 2 ** 0 * 500 = 500ms
    // 2 ** 1 * 500 = 1000ms  => 1500ms
    // 2 ** 2 * 500 = 2000ms  => 3500ms
    const bailoutMS = 2 ** errors.length * 500;
    // console.error(`asyncRetry: try ${errors.length + 1} failed, retries=${options.retries}. Delaying next try ${bailoutMS}ms`);
    await Bluebird.delay(bailoutMS);

    // console.warn(`asyncRetry: retrying after ${bailoutMS}ms`);
    return asyncRetry(fn, options, [...errors, e]);
  }

  return t;
}
