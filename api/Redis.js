const { createClient } = require('redis')
const schedule = require('./SimpleSchedular');

const client = createClient({ url: process.env.REDIS_URL || '' });
var flag = false, eflag = true
client.connect()
// .then(() => { console.log("Connected to Rdis"); })
// .catch(err => { console.log('Redis Client Error', err.message) });


//To check whether the token has expired
const isTokenExpired = (token) => !(Date.now() >= JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString()).exp * 1000)

client.on('connect', () => {
    if (!flag) {
        console.log("Connected to Rdis");
        Filtering()
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

//flitering the redis database in terms of RefreshTokens by removing old tokens
async function Filtering() {
    try {
        let x = await client.lRange('RefreshToken', 0, -1)
        let len = x.length
        x = x.filter(isTokenExpired)
        if (x.length > 0 && len != x.length) {
            await client.del('RefreshToken').catch((er) => console.log(er.message))
            client.lPush('RefreshToken', x).catch((er) => console.log(er.message))
        }
        else if (x.length == 0)
            await client.del('RefreshToken').catch((er) => console.log(er.message))
        console.log('Running my task at', new Date());
    }
    catch (er) {
        console.log(er.message)
    }
}
schedule(Filtering, 60 * 60 * 1000)

// await client.disconnect();
module.exports = client