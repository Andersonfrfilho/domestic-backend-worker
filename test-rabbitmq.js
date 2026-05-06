"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nestjs_rabbitmq_1 = require("@golevelup/nestjs-rabbitmq");
const uri = `amqp://domestic:backendapi123@rabbitmq:5672`;
async function test() {
    console.log('Testing RabbitMQ connection...');
    console.log('URI:', uri);
    const conn = new nestjs_rabbitmq_1.AmqpConnection({
        name: 'test',
        uri,
        connectionInitOptions: { timeout: 10000, wait: true },
    });
    try {
        await conn.init();
        console.log('✅ CONNECTED to RabbitMQ successfully!');
        await conn.close();
        console.log('✅ Connection closed.');
    }
    catch (err) {
        console.error('❌ Connection failed:', err.message);
    }
}
test();
//# sourceMappingURL=test-rabbitmq.js.map