import * as should from 'should';
import * as _ from "lodash";
import { asyncRetry } from './asyncRetry';
import * as Bluebird from "bluebird";

describe('utils/asyncRetry', function () {

  it('retry works as expected when last succeeds', async () => {
    const RETRIES = 2;
    let cnt = 0;

    await asyncRetry(async () => {
      await Bluebird.delay(1);

      cnt += 1;
      if (cnt <= RETRIES) {
        throw new Error("not yet")
      }

    }, { retries: RETRIES });

    should(cnt).eql(RETRIES + 1);

  });

  it('retry works as expected when all fail', async () => {
    const RETRIES = 2;
    let cnt = 0;
    let err: AggregateError | null = null;

    try {
      await asyncRetry(async () => {
        await Bluebird.delay(1);

        cnt += 1;
        throw new Error("step err");

      }, { retries: RETRIES });
    } catch (e: any) {
      err = e;
    }

    // console.log(err);
    should(cnt).eql(RETRIES + 1);
    should(err).instanceOf(AggregateError);


  });
});