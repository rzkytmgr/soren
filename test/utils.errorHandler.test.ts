import test from "node:test";
import assert from "node:assert";
import { errorHandler } from "../src/utils/errorHandler";
import { BaseError } from "../src/lib/errors/BaseError";
import { BaseErrorOptions } from "../src/types/types";

test("test/error-handler.test.ts", async (t) => {
    let called: string;

    class TestError extends BaseError {
        constructor(message: string, options?: BaseErrorOptions) {
            super(message, options);
        }

        debug(): void {
            called = "log_debug";
        }

        info(): void {
            called = "log_info";
        }

        warn(): void {
            called = "log_warn";
        }

        error(): void {
            called = "log_error";
        }
    }

    const originalConsoleError = console.error;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    console.error = (...args) => {
        called = "console_error";
    };

    await t.test("should call log debug", () => {
        /** if logger set to debug */
        errorHandler(
            new TestError("BaseError logger debug", {
                logger: "debug",
            }),
        );
        assert.equal(called, "log_debug");
    });

    await t.test("should call log info", () => {
        /** if logger set to info */
        errorHandler(
            new TestError("BaseError logger info", {
                logger: "info",
            }),
        );
        assert.equal(called, "log_info");
    });

    await t.test("should call log warn", () => {
        /** if logger set to warn */
        errorHandler(
            new TestError("BaseError logger warn", {
                logger: "warn",
            }),
        );
        assert.equal(called, "log_warn");
    });

    await t.test("should call log error", () => {
        /** if logger set to error */
        errorHandler(
            new TestError("BaseError logger error", {
                logger: "error",
            }),
        );
        assert.equal(called, "log_error");
    });

    await t.test("should call console error", () => {
        /** if options details set to true */
        errorHandler(
            new TestError("BaseError console error", {
                details: true,
            }),
        );
        assert.equal(called, "console_error");
    });

    await t.test("should call console error but not instance of BaseError class", () => {
        /** if handler argument is not instance of BaseError class */
        errorHandler(new Error("Native error test"));
        assert.equal(called, "console_error");
    });

    console.error = originalConsoleError;
});
