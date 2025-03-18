import amqp from "amqplib";
import { QUEUE_URL } from "./config";
import redis from "./redis";

const receiveFromQueue = async (
  queue: string,
  callback: (message: string) => void
) => {
  const connection = await amqp.connect(QUEUE_URL);
  const channel = await connection.createChannel();

  const exchange = "order";
  await channel.assertExchange(exchange, "direct", { durable: true });

  const queueName = await channel.assertQueue(queue, { durable: true });
  await channel.bindQueue(queueName.queue, exchange, queue);

  channel.consume(
    queueName.queue,
    (message) => {
      if (message) {
        callback(message.content.toString());
        //channel.ack(message);
      }
    },
    { noAck: true }
  );
};

receiveFromQueue("clear-cart", (message) => {
  console.log(`Received message: ${message}`);
  const parsedMessage = JSON.parse(message);

  const cartSessionId = parsedMessage.cartSessionId;
  console.log("cartSessionId: ", cartSessionId);
  redis.del(`session:${cartSessionId}`);
  redis.del(`cart:${cartSessionId}`);

  console.log("cart cleared");
});
