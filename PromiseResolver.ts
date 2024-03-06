// ? CREATE A CLASS WHICH SHOULD TAKE ARRAY OF N PROMISE AND SUPER BATCH INDEX IT SHOULD AUTOMATICALLY RESOLVE WITH FUNCTION TO HANDLE
// ? If you have 10_00_000 Promises Array first it will divide Batch size  which is 10_000.
// ? BATCH_SIZE AND SUPER_BATCH_SIZE
// ? Super Batch size can be rpc call limit

export class PromiseResolver {
  public static async main() {
    const promises = this.createPromiseBatch(1000);
    const handleResultsFunction = async (results: any[]) => {
      console.log("Handled results:", results);
    };
    await this.Resolve(promises, 100, 2, handleResultsFunction);
  }

  private static createPromiseBatch(size: number) {
    const calls = [];
    for (let index = 0; index < size; index++) {
      calls.push(
        new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve(index);
          }, 1000);
        })
      );
    }
    return calls;
  }

  private static divideBatch(PromiseArray: any[], batchSize: number) {
    const calls: any[] = [];
    for (let i = 0; i < PromiseArray.length; i += batchSize) {
      calls.push(PromiseArray.slice(i, i + batchSize));
    }
    return calls;
  }

  private static async Resolve(
    PromiseArray: any[],
    batchSize: number,
    superBatchSize: number,
    handler: (results: any[]) => void
  ) {
    const batches = this.divideBatch(PromiseArray, batchSize);
    const superBatches: any[] = [];

    for (let i = 0; i < batches.length; i += superBatchSize) {
      superBatches.push(batches.slice(i, i + superBatchSize));
    }

    await Promise.all(superBatches.map((batch) => Promise.all(batch)))
      .then((results) => {
        handler(results.flat());
      })
      .catch((error) => {
        console.error("Error occurred while resolving promises:", error);
      });
  }
}

PromiseResolver.main();
