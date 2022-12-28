const { createClient } = require('redis')

const client = createClient({ url: process.env.REDIS_URL || '' });
var flag = false, eflag = true
client.connect()
// .then(() => { console.log("Connected to Rdis"); })
// .catch(err => { console.log('Redis Client Error', err.message) });
client.on('connect', () => {
    if (!flag) {
        console.log("Connected to Rdis");
        flag = true;
        eflag = true;
    }
})
client.on('error', err => {
    if (eflag) {
        console.log('Redis Client Error', err.message);
        flag = false;
        eflag = false;
    }
})
// await client.disconnect();
module.exports = client