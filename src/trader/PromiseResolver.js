"use strict";
// ? CREATE A CLASS WHICH SHOULD TAKE ARRAY OF N PROMISE AND SUPER BATCH INDEX IT SHOULD AUTOMATICALLY RESOLVE WITH FUNCTION TO HANDLE
// ? If you have 10_00_000 Promises Array first it will divide Batch size  which is 10_000.
// ? BATCH_SIZE AND SUPER_BATCH_SIZE
// ? Super Batch size can be rpc call limit
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromiseResolver = void 0;
class PromiseResolver {
    static async main() {
        const promises = this.createPromiseBatch(1000);
        const handleResultsFunction = async (results) => {
            console.log("Handled results:", results);
        };
        // await this.Resolve(promises, 100, 2, handleResultsFunction);
    }
    static createPromiseBatch(size) {
        const calls = [];
        for (let index = 0; index < size; index++) {
            calls.push(new Promise((resolve, reject) => {
                setTimeout(() => {
                    resolve(index);
                }, 1000);
            }));
        }
        return calls;
    }
    static async divideBatch(PromiseArray, batchSize) {
        const calls = [];
        for (let i = 0; i < (await PromiseArray).length; i += batchSize) {
            calls.push((await PromiseArray).slice(i, i + batchSize));
        }
        return calls;
    }
    static async Resolve(PromiseArray, batchSize, superBatchSize, handler) {
        const batches = this.divideBatch(PromiseArray, batchSize);
        const superBatches = [];
        for (let i = 0; i < (await batches).length; i += superBatchSize) {
            superBatches.push((await batches).slice(i, i + superBatchSize));
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
exports.PromiseResolver = PromiseResolver;
