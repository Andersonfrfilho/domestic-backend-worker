"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishEvent = publishEvent;
exports.sleep = sleep;
const amqplib_1 = __importDefault(require("amqplib"));
const RABBITMQ_URL = process.env.RABBITMQ_URL ?? 'amqp://zolve:zolve123@localhost:5672';
const EXCHANGE = process.env.RABBITMQ_EXCHANGE ?? 'zolve.events';
async function publishEvent(routingKey, payload) {
    const conn = await amqplib_1.default.connect(RABBITMQ_URL);
    const ch = await conn.createChannel();
    await ch.assertExchange(EXCHANGE, 'topic', { durable: true });
    ch.publish(EXCHANGE, routingKey, Buffer.from(JSON.stringify(payload)), {
        contentType: 'application/json',
        persistent: true,
    });
    await ch.close();
    await conn.close();
}
async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
//# sourceMappingURL=amqp.js.map