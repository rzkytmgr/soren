import test from "node:test";
import assert from "node:assert";
import { eventWrapper } from "../src/utils/wrapper";
import { BaileysEventMap } from "baileys";

test("test/utils.wrapper.test.ts", async (t) => {
    const mockListener = {
        mock: true,
    } as unknown as BaileysEventMap[keyof BaileysEventMap];

    await t.test("should return void", () => {
        assert.doesNotThrow(() => {
            eventWrapper(() => {})(mockListener);
        });

        assert.doesNotThrow(() => {
            eventWrapper(() => {
                return;
            })(mockListener);
        });

        assert.doesNotThrow(() => {
            eventWrapper((arg: typeof mockListener) => {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                if (!arg.mock) {
                    throw new Error("event wrapper function throw error");
                }
            })(mockListener);
        });
    });

    await t.test("should throw error", () => {
        assert.throws(() => {
            eventWrapper(() => {
                throw new Error("Function event wrapper throw error");
            })(mockListener);
        });

        assert.throws(() => {
            eventWrapper((arg) => {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                if (arg.mock) {
                    throw new Error("Function event wrapper throw error");
                }
            })(mockListener);
        });
    });
});
