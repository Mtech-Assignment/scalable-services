const amqp = require('amqplib');
const NFT = require('../models/NFT');

exports.consumeEvent = async function() {
  try {
    const connection = await amqp.connect('amqp://localhost');
    const channel = await connection.createChannel();

    // Declare a direct exchange and a queue with a specific routing key
    const exchange = 'direct_exchange';
    const queue = 'nft_queue';
    await channel.assertExchange(exchange, 'direct', { durable: true });
    await channel.assertQueue(queue, { durable: true });

    // Bind the queue to the exchange with the routing key
    await channel.bindQueue(queue, exchange, queue);

    console.log("Waiting for messages in queue:", queue);
    channel.consume(queue, async (msg) => {
      if (msg !== null) {
        const message = JSON.parse(msg.content.toString());
        console.log("Received Event Message:", message);

        switch(message.type) {
            case 'NFT_PRICE_CHANGE':
                await NFT.findByIdAndUpdate(
                    message.nft_id ,
                    { price: message.new_price }
                );

            case 'NFT_OWNER_CHANGE':
                await NFT.findByIdAndUpdate(
                    message.nft_id ,
                    { owner: message.new_owner }
                );

        }

        // Acknowledge message to let rabbitmq know, we processed the message,
        //  if disconnects then rabbitmq will re-deliver it
        channel.ack(msg);
      }
    });
  } catch (error) {
    console.error("Error receiving message:", error);
  }
}
