import * as Bluebird from "bluebird";
import * as _ from "lodash";

// 2 ** 0 * 100 = 100ms
// 2 ** 1 * 100 = 200ms  => 300ms
// 2 ** 2 * 100 = 400ms  => 700ms
// 2 ** 3 * 100 = 800ms  => 1500ms
// 2 ** 4 * 100 = 1600ms => 3100ms
// 2 ** 5 * 100 = 3200ms => 6300ms
// 2 ** 6 * 100 = 6400ms => 12700ms
export async function asyncRetry<T>(fn: () => Promise<T>, options: { retries: number }, errors: any[] = []): Promise<T> {
  let t: T;
  try {
    t = await fn();
  } catch (e) {

    if (errors.length >= options.retries) {
      throw new AggregateError(_.uniq(errors), `asyncRetry: maximal retries exceeded. retries=${options.retries} errors=${errors.length}`);
    }

    await Bluebird.delay(2 ** options.retries * 100);

    return asyncRetry(fn, options, [...errors, e])
  }

  return t;
}