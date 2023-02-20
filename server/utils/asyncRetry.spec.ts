import * as Bluebird from "bluebird";
import * as should from "should";
import { asyncRetry } from "./asyncRetry";

describe("utils/asyncRetry", function () {
  it("retry works as expected when last succeeds", async () => {
    const RETRIES = 2;
    let cnt = 0;

    await asyncRetry(
      async () => {
        await Bluebird.delay(1);

        cnt += 1;
        if (cnt <= RETRIES) {
          throw new Error("not yet");
        }
      },
      { retries: RETRIES }
    );

    should(cnt).eql(RETRIES + 1);
  });

  it("retry works as expected when all fail with same error", async () => {
    const RETRIES = 2;
    let cnt = 0;
    let err: AggregateError | null = null;

    try {
      await asyncRetry(
        async () => {
          await Bluebird.delay(1);

          cnt += 1;
          throw new Error("step err");
        },
        { retries: RETRIES }
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      err = e;
    }

    // console.log(err);
    should(cnt).eql(RETRIES + 1);
    should(err).instanceOf(AggregateError);
    should(err?.errors.length).eql(1); // unique errors returned by msg
  });

  it("retry works as expected when all fail with different errors", async () => {
    const RETRIES = 2;
    let cnt = 0;
    let err: AggregateError | null = null;

    try {
      await asyncRetry(
        async () => {
          await Bluebird.delay(1);

          cnt += 1;
          throw new Error("step" + cnt);
        },
        { retries: RETRIES }
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      err = e;
    }

    // console.log(err);
    should(cnt).eql(RETRIES + 1);
    should(err).instanceOf(AggregateError);
    should(err?.errors.length).eql(RETRIES + 1);
  });
});
