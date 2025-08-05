import test from "node:test";
import assert from "assert";

import { eventHandler } from "../src/socket/events/messageUpsertHandler";
import { GeneralError } from "../src/lib/errors/GeneralError";
import { BaileysEventMap } from "baileys";
import {
    SorenCommandMeta,
    SorenSocketType,
} from "../src/types/types";
import {
    MessageArea,
    MessageRoles,
    MessageType,
} from "../src/enums/enums";

test("test/event.message-upsert.test.ts", async (t) => {
    const commandsMock = new Map<string, SorenCommandMeta>();

    await t.test("function control flow", async (t) => {
        const socketMock = {
            config: {
                SOREN_BOT_OWNER: "1234567890",
                SOREN_COMMAND_PREFIX: ["/"],
            },
            commands: commandsMock,
        } as SorenSocketType;

        await t.test("should throw error if message type value is not notify", async () => {
            const requestSnapshot = {
                messages: [{}],
                type: "append",
            } as unknown as BaileysEventMap["messages.upsert"];

            await assert.rejects(eventHandler(socketMock)(requestSnapshot), (err) => {
                assert(err instanceof GeneralError);
                assert.strictEqual(
                    err.message,
                    "Unexpected message type received expected 'notify'",
                );
                return true;
            });
        });

        await t.test("should throw error if message object is undefined", async () => {
            const requestSnapshot = {
                messages: [{}],
                type: "notify",
            } as unknown as BaileysEventMap["messages.upsert"];

            await assert.rejects(eventHandler(socketMock)(requestSnapshot), (err) => {
                assert(err instanceof GeneralError);
                assert.strictEqual(
                    err.message,
                    "Unexpected behavior, message from message object is undefined",
                );
                return true;
            });
        });

        await t.test("should throw error if received message is unsupported message type", async () => {
            const requestSnapshot = {
                messages: [{
                    message: {},
                }],
                type: "notify",
            } as unknown as BaileysEventMap["messages.upsert"];

            await assert.rejects(eventHandler(socketMock)(requestSnapshot), (err) => {
                assert(err instanceof GeneralError);
                assert.strictEqual(
                    err.message,
                    "Client is received unsupported message type",
                );
                return true;
            });
        });

        await t.test("should throw error if remote jid is undefined or message area is undefined", async () => {
            const requestSnapshot = {
                messages: [{
                    message: {
                        conversation: "test",
                    },
                    key: {
                        remoteJid: null,
                    },
                }],
                type: "notify",
            } as unknown as BaileysEventMap["messages.upsert"];

            await assert.rejects(eventHandler(socketMock)(requestSnapshot), (err) => {
                assert(err instanceof GeneralError);
                assert.strictEqual(
                    err.message,
                    "Probably remoteJid is undefined. Cannot define message area value",
                );
                return true;
            });
        });

        await t.test("should return null if the command prefix is unlisted", async () => {
            const requestSnapshot = {
                messages: [{
                    message: {
                        conversation: "test",
                    },
                    key: {
                        remoteJid: "1234567890@s.whatsapp.net",
                    },
                }],
                type: "notify",
            } as unknown as BaileysEventMap["messages.upsert"];

            const handlerReturn = await eventHandler(socketMock)(requestSnapshot);
            assert.equal(handlerReturn, null);
        });

        await t.test("should throw error if the command is unlisted", async () => {
            const requestSnapshot = {
                messages: [{
                    message: {
                        conversation: "/ping",
                    },
                    key: {
                        remoteJid: "1234567890@s.whatsapp.net",
                    },
                }],
                type: "notify",
            } as unknown as BaileysEventMap["messages.upsert"];

            await assert.rejects(eventHandler(socketMock)(requestSnapshot), (err) => {
                assert(err instanceof GeneralError);
                assert.strictEqual(
                    err.message,
                    "Unsupported command 'ping' received",
                );
                return true;
            });
        });

        await t.test("should throw error if the area is unlisted", async () => {
            const requestSnapshot = {
                messages: [{
                    message: {
                        conversation: "/ping",
                    },
                    key: {
                        remoteJid: "1234567890@s.whatsapp.net",
                    },
                }],
                type: "notify",
            } as unknown as BaileysEventMap["messages.upsert"];

            commandsMock.set("ping", {
                commandArea: [MessageArea.GroupMessage],
            } as SorenCommandMeta);

            await assert.rejects(eventHandler(socketMock)(requestSnapshot), (err) => {
                assert(err instanceof GeneralError);
                assert.strictEqual(
                    err.message,
                    `Allowed area ${MessageArea.GroupMessage}`,
                );
                return true;
            });
        });

        await t.test("should throw error if the role is unlisted", async () => {
            const requestSnapshot = {
                messages: [{
                    message: {
                        conversation: "/ping",
                    },
                    key: {
                        remoteJid: "1234567890@s.whatsapp.net",
                    },
                }],
                type: "notify",
            } as unknown as BaileysEventMap["messages.upsert"];

            commandsMock.set("ping", {
                commandArea: [MessageArea.PersonalMessage],
                commandRoles: [MessageRoles.GroupMember],
            } as SorenCommandMeta);

            await assert.rejects(eventHandler(socketMock)(requestSnapshot), (err) => {
                assert(err instanceof GeneralError);
                assert.strictEqual(
                    err.message,
                    `Allowed roles ${MessageRoles.GroupMember}`,
                );
                return true;
            });
        });

        await t.test("should throw error if the message type is unlisted", async () => {
            const requestSnapshot = {
                messages: [{
                    message: {
                        conversation: "/ping",
                    },
                    key: {
                        remoteJid: "1234567890@s.whatsapp.net",
                    },
                }],
                type: "notify",
            } as unknown as BaileysEventMap["messages.upsert"];

            commandsMock.set("ping", {
                commandArea: [MessageArea.PersonalMessage],
                commandRoles: [MessageRoles.BotOwner],
                commandMessageType: [MessageType.AudioMessage],
            } as SorenCommandMeta);

            await assert.rejects(eventHandler(socketMock)(requestSnapshot), (err) => {
                assert(err instanceof GeneralError);
                assert.strictEqual(
                    err.message,
                    `Allowed message type ${MessageType.AudioMessage}`,
                );
                return true;
            });
        });
    });

    await t.test("access control", async (t) => {
        const socketMock = {
            config: {
                SOREN_BOT_OWNER: "1234567890",
                SOREN_COMMAND_PREFIX: ["/"],
            },
            commands: commandsMock,
            groupMetadata() {
                return {
                    participants: [{
                        id: "member@s.whatsapp.net",
                        admin: null,
                    }, {
                        id: "admin@s.whatsapp.net",
                        admin: "admin",
                    }, {
                        id: "superadmin@s.whatsapp.net",
                        admin: "superadmin",
                    }],
                };
            },
        } as unknown as SorenSocketType;

        await t.test("testing based on area", async () => {
            commandsMock.set("ping", {
                commandArea: [
                    MessageArea.PersonalMessage,
                ],
                commandRoles: [
                    MessageRoles.BotOwner,
                ],
                commandMessageType: [
                    MessageType.TextMessage,
                ],
            } as SorenCommandMeta);

            // 1. Personal Message -> Allowed Personal Message (Success)
            await assert.doesNotReject(
                eventHandler(socketMock)({
                    messages: [{
                        message: {
                            conversation: "/ping",
                        },
                        key: {
                            remoteJid: "1234567890@s.whatsapp.net", // personal message
                        },
                    }],
                    type: "notify",
                }),
            );

            // 2. Group Message -> Allowed Personal Message (Error)
            await assert.rejects(
                eventHandler(socketMock)({
                    messages: [{
                        message: {
                            conversation: "/ping",
                        },
                        key: {
                            remoteJid: "1234567890@g.us", // group message
                        },
                    }],
                    type: "notify",
                }),
            );

            // 3. Group Message -> Allowed Group Message (Success)
            commandsMock.set("ping", {
                commandArea: [
                    MessageArea.GroupMessage, // allowed group message
                ],
                commandRoles: [
                    MessageRoles.GroupMember,
                ],
                commandMessageType: [
                    MessageType.TextMessage,
                ],
            } as SorenCommandMeta);

            await assert.doesNotReject(
                eventHandler(socketMock)({
                    messages: [{
                        message: {
                            conversation: "/ping",
                        },
                        key: {
                            remoteJid: "group@g.us", // group message
                            participant: "member@s.whatsapp.net",
                        },
                    }],
                    type: "notify",
                }),
            );

            // 4. Personal Message -> Allowed Group Message (Error)
            await assert.rejects(
                eventHandler(socketMock)({
                    messages: [{
                        message: {
                            conversation: "/ping",
                        },
                        key: {
                            remoteJid: "personal@s.whatsapp.net", // personal message
                        },
                    }],
                    type: "notify",
                }),
            );

            // 5. Personal Message -> Allowed Personal Message and Group Message (Success)
            commandsMock.set("ping", {
                commandArea: [
                    MessageArea.GroupMessage, // allowed group message
                    MessageArea.PersonalMessage, // allowed personal message too
                ],
                commandRoles: [
                    MessageRoles.GroupMember,
                    MessageRoles.Personal,
                ],
                commandMessageType: [
                    MessageType.TextMessage,
                ],
            } as SorenCommandMeta);

            await assert.doesNotReject(
                eventHandler(socketMock)({
                    messages: [{
                        message: {
                            conversation: "/ping",
                        },
                        key: {
                            remoteJid: "group@g.us", // group message
                            participant: "member@s.whatsapp.net",
                        },
                    }],
                    type: "notify",
                }),
            );

            // 6. Group Message -> Allowed Personal Message and Group Message (Success)
            await assert.doesNotReject(
                eventHandler(socketMock)({
                    messages: [{
                        message: {
                            conversation: "/ping",
                        },
                        key: {
                            remoteJid: "message@s.whatsapp.net", // personal message
                        },
                    }],
                    type: "notify",
                }),
            );
        });

        await t.test("testing based on role", async () => {
            // 1. Bot owner
            // 2. Group owner
            // 3. Group admin
            // 4. Group Member
            // 5. Personal Message
            // 6. Multiple role
            // 7. general (all roles)

            // 1. Bot owner only
            commandsMock.set("ping", {
                commandArea: [
                    MessageArea.PersonalMessage,
                ],
                commandRoles: [
                    MessageRoles.BotOwner,
                ],
                commandMessageType: [
                    MessageType.TextMessage,
                ],
            } as SorenCommandMeta);
            // 1.1 Bot Owner Request (success)
            await assert.doesNotReject(
                eventHandler(socketMock)({
                    messages: [{
                        message: {
                            conversation: "/ping",
                        },
                        key: {
                            remoteJid: "1234567890@s.whatsapp.net", // personal message
                        },
                    }],
                    type: "notify",
                }),
            );
            // 1.2 Not Bot Owner Request (Error)
            await assert.rejects(
                eventHandler(socketMock)({
                    messages: [{
                        message: {
                            conversation: "/ping",
                        },
                        key: {
                            remoteJid: "other@s.whatsapp.net", // personal message
                        },
                    }],
                    type: "notify",
                }),
            );

            // 2. Group Owner only
            commandsMock.set("ping", {
                commandArea: [
                    MessageArea.GroupMessage,
                ],
                commandRoles: [
                    MessageRoles.GroupOwner,
                ],
                commandMessageType: [
                    MessageType.TextMessage,
                ],
            } as SorenCommandMeta);
            // 2.2 Group Owner Request (success)
            await assert.doesNotReject(
                eventHandler(socketMock)({
                    messages: [{
                        message: {
                            conversation: "/ping",
                        },
                        key: {
                            remoteJid: "group@g.us", // group message
                            participant: "superadmin@s.whatsapp.net", // group owner
                        },
                    }],
                    type: "notify",
                }),
            );
            // 2.2 Not Group Owner Request (Error)
            await assert.rejects(
                eventHandler(socketMock)({
                    messages: [{
                        message: {
                            conversation: "/ping",
                        },
                        key: {
                            remoteJid: "other@s.whatsapp.net", // personal message
                        },
                    }],
                    type: "notify",
                }),
            );
        });
    });
});
