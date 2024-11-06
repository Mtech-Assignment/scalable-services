const amqp = require('amqplib');
require('dotenv').config();

exports.sendEventToNft = async function(message) {
  try {
    const connection = await amqp.connect(process.env.BROKER_URL);
    const channel = await connection.createChannel();

    // Declare a direct exchange and a specific routing key
    const exchange = 'direct_exchange';
    const routingKey = 'nft_queue';
    await channel.assertExchange(exchange, 'direct', { durable: true });

    // Publish the message to the direct exchange with a routing key
    channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(message)), {
      persistent: true, // ensures message durability
    });
    console.log("Sent Event Message: ", message);

    setTimeout(() => connection.close(), 500); // Close connection after a delay
  } catch (error) {
    console.error("Error sending message:", error);
  }
}
