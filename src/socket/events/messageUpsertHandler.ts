import {
    MessageArea,
    MessageRoles,
    MessageType,
} from "@/enums/enums";
import { GeneralError } from "@/lib/errors";
import {
    SorenCommandMeta,
    SorenSocketType,
} from "@/types/types";
import { BaileysEventMap } from "baileys";

const eventKey: keyof BaileysEventMap = "messages.upsert";
const eventHandler = (socket: SorenSocketType) => async (listener: BaileysEventMap[typeof eventKey]) => {
    const { type, messages } = listener;

    const messageObject = messages[0];
    const { message } = messageObject;

    /** When client received message type other than notify */
    if (type !== "notify") {
        throw new GeneralError("Unexpected message type received expected 'notify'");
    }

    /** Sometimes the message return undefined */
    if (!message) {
        throw new GeneralError("Unexpected behavior, message from message object is undefined");
    }

    const messageMapping = {
        /** Client received only text message */
        conversation: {
            type: MessageType.TextMessage,
            text: message.conversation,
        },
        /** Client received image message */
        imageMessage: {
            type: MessageType.ImageMessage,
            text: message.imageMessage?.caption,
        },
        /** Client received image message */
        videoMessage: {
            type: MessageType.VideoMessage,
            text: message.videoMessage?.caption,
        },
        /** Client received audio message */
        audioMessage: {
            type: MessageType.AudioMessage,
            text: null,
        },
        /** Client received document without text message */
        documentMessage: {
            type: MessageType.DocumentMessage,
            text: message.documentMessage?.caption,
        },
        /** Client received document with text message */
        documentWithCaptionMessage: {
            type: MessageType.DocumentMessage,
            text: message.documentWithCaptionMessage?.message?.documentMessage?.caption,
        },
        /** Client received quoted message */
        extendedTextMessage: {
            type: MessageType.QuotedMessage,
            text: message.extendedTextMessage?.text,
        },
        /** Client received only one contact message */
        contactMessage: {
            type: MessageType.ContactMessage,
            text: null,
        },
        /** Client received two or more contacts message */
        contactsArrayMessage: {
            type: MessageType.ContactMessage,
            text: null,
        },
        /** Client received location (not live location) message */
        locationMessage: {
            type: MessageType.LocationMessage,
            text: null,
        },
        /** Client received sticker message */
        stickerMessage: {
            type: MessageType.StickerMessage,
            text: null,
        },
        /** Client received reaction on a message */
        reactionMessage: {
            type: MessageType.ReactionMessage,
            text: null,
        },
    };

    const receivedMessageType = <keyof typeof messageMapping | undefined> Object.keys(message).find((messageType) =>
        messageMapping[messageType as keyof typeof messageMapping]
    );

    /** When client received unsupported message type */
    if (!receivedMessageType) {
        throw new GeneralError("Client is received unsupported message type");
    }

    const messageMap = messageMapping[receivedMessageType];
    const messageArea = messageObject.key.remoteJid
        ? (
            messageObject.key.remoteJid.endsWith("@g.us")
                ? MessageArea.GroupMessage
                : MessageArea.PersonalMessage
        )
        : undefined;
    const senderId = messageArea === MessageArea.GroupMessage
        ? messageObject.key.participant
        : messageObject.key.remoteJid;

    const messageType = messageMap.type;
    const messageText = (messageMap.text || "").split(" ");
    const messageCommand = messageText[0].slice(1);
    const messageArgs = messageText.slice(1);
    const messagePrefix = messageText[0].slice(0, 1);

    let senderRole: MessageRoles | null = senderId === socket.config.SOREN_BOT_OWNER + "@s.whatsapp.net"
        ? MessageRoles.BotOwner
        : null;

    /**
     * When message area is undefined.
     * ***Becareful if remoteJid is undefined that means messageArea variable also return undefined
     */
    if (!messageObject.key.remoteJid || !messageArea) {
        throw new GeneralError(`Probably remoteJid is undefined. Cannot define message area value`);
    }

    /** When registered prefix is not match with prefix received */
    if (!socket.config.SOREN_COMMAND_PREFIX.includes(messagePrefix)) {
        return null;
    }

    /** When command is not registered */
    let commandMetaObject = socket.commands.get(messageCommand);
    if (!commandMetaObject) {
        /** @Sendmessage command is not registered */
        throw new GeneralError(`Unsupported command '${messageCommand}' received`);
    }

    /** When command is as an alternative command */
    if (typeof commandMetaObject === "string") {
        commandMetaObject = <SorenCommandMeta> socket.commands.get(commandMetaObject);
    }

    /** Control flow when message come from group or personal chat */
    if (!senderRole) {
        if (messageArea === MessageArea.GroupMessage) {
            // todo: add caching to reduce request to fetch all participants
            const groupMetadata = await socket.groupMetadata(messageObject.key.remoteJid);
            const participant = groupMetadata.participants.find((participant) =>
                participant.id === messageObject.key.participant
            );

            if (!participant) {
                throw new GeneralError(`Participant metadata undefined. Cannot assign the role`);
            }

            if (participant.admin === "superadmin") {
                senderRole = MessageRoles.GroupOwner;
            } else if (participant.admin === "admin") {
                senderRole = MessageRoles.GroupAdmin;
            } else {
                senderRole = MessageRoles.GroupMember;
            }
        } else {
            senderRole = MessageRoles.Personal;
        }
    }

    /** Message allowed area */
    if (!commandMetaObject.commandArea.includes(messageArea)) {
        throw new GeneralError(`Allowed area ${commandMetaObject.commandArea}`);
    }

    /** Message allowed roles */
    if (!commandMetaObject.commandRoles.includes(senderRole)) {
        throw new GeneralError(`Allowed roles ${commandMetaObject.commandRoles}`);
    }

    /** Message allowed types */
    if (!commandMetaObject.commandMessageType.includes(messageType)) {
        throw new GeneralError(`Allowed message type ${commandMetaObject.commandMessageType}`);
    }

    console.debug("Passed");
};

export {
    eventKey,
    eventHandler,
};
