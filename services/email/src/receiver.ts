import amqp from "amqplib";
import { defaultSender, QUEUE_URL, transporter } from "./config";
import prisma from "./prisma";

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

receiveFromQueue("send-email", async (message) => {
  console.log(`Received message (send-email): ${message}`);

  const parsedBody = JSON.parse(message);

  const { userEmail, grandTotal, id} = parsedBody;

  const from = defaultSender;
  const subject = "Order Confirmation";
  const body = `Thank you for your order. Your order ${id} has been confirmed. Your total is ${grandTotal}`;

  console.log(`Sending email to ${userEmail}`);

  const emailOptions = {
    from,
    to: userEmail,
    subject,
    text: body,
  };

  //send the email
  const { rejected } = await transporter.sendMail(emailOptions);
  if(rejected.length > 0) {
    console.log("Email could not be sent!");
    return;
  }

  await prisma.email.create({
    data: {
      sender: from,
      recipient: userEmail,
      subject,
      body,
      source: "OrderConfirmation",
    },
  })
  console.log("Email Sent");
});
