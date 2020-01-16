const os = require('os');
const ociRequestor = require('./ociRequestor');
const fs = require('fs');
const https = require('https');
const configs = require('./oci-configuration').configs;
const log = require('./logger').l

const CURSOR_TYPE=  "TRIM_HORIZON" // AFTER_OFFSET, AT_OFFSET, AT_TIME, LATEST, TRIM_HORIZON; note: only use LATEST and TRIM_HORIZON for now

let privateKeyPath = configs.privateKeyPath
if (privateKeyPath.indexOf("~/") === 0) {
    privateKeyPath = privateKeyPath.replace("~", os.homedir())
}
const privateKey = fs.readFileSync(privateKeyPath, 'ascii');

function signRequest(request, body = "") {
    ociRequestor.sign(request, {
        privateKey: privateKey,
        keyFingerprint: configs.keyFingerprint,
        tenancyId: configs.tenancyId,
        userId: configs.authUserId,
        "passphrase": configs.pass_phrase,
    }, body);
}
// generates a function to handle the https.request response object
function handleRequest(callback) {

    return function (response) {
        var responseBody = "";
        //log(JSON.stringify(response.headers), "callback function defined in handleRequest")
        response.on('data', function (chunk) {
            responseBody += chunk;
        });

        response.on('end', function () {
            //log("Response:" + responseBody)
            callback(JSON.parse(responseBody));
        });
    }
}

function getCursor(streamId, callback) {
    var options = {
        host: configs.streamingAPIEndpoint,
        path: "/20180418/streams/" + encodeURIComponent(streamId) + "/cursors",
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    };
    var request = https.request(options, handleRequest(callback));
    //log("Go Sign and Send Request") 
    const payload = {
        "partition": "0",
        "type": CURSOR_TYPE
    }
    let body = JSON.stringify(payload)
    signRequest(request, body);
    request.write(body)
    request.end();
};

function getMessages(streamId, cursor, callback) {
    var options = {
        host: configs.streamingAPIEndpoint,
        path: "/20180418/streams/" + encodeURIComponent(streamId) + "/messages?cursor=" + encodeURIComponent(cursor) + "&limit=100",
        method: 'GET',
        headers: {
        }
    };
    var request = https.request(options, handleRequest(callback));
    signRequest(request);
    request.end();
};

function consumeMessages(streamId) {
    // first open a cursor for the stream - for all messages still available in the stream
    getCursor(streamId, function (data) {
        console.log("Cursor on Stream received:"+JSON.stringify(data));
        // using the cursor, retrieve all available messages
        getMessages(streamId, data.value, function (data) {
            console.log("Messages Consumed from Stream:");
            console.log("raw data "+JSON.stringify(data));
            try {
            data.forEach((e) => {
                let buff = new Buffer.from(e.value, 'base64');
                let text = buff.toString('ascii');
                log( text)
            })
            } catch (e) {console.log(`Processing data failed with ${e}` )}
            
        })
    });
    return { "Status": "OK" }
}

module.exports = {
    consume: consumeMessages
}

run2 = async function () {

    const input = { "streamId": process.env["streamId"] }
    log("input: " + JSON.stringify(input))
    let response = consumeMessages(input.streamId)
    log("response: " + response)
    log("response: " + JSON.stringify(response))
}


run2()
