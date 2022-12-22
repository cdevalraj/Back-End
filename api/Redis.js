const { createClient } = require('redis')

const client = createClient({ url: process.env.REDIS_URL || '' });
(async () => {
    await client.connect()
        .then(() => { console.log("Connected to Rdis"); })
        .catch(err => { console.log('Redis Client Error', err.message) });
})()
// await client.disconnect();
module.exports = client