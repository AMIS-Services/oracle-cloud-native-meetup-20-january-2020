const os = require('os');
const ociRequestor = require('./ociRequestor');
const fs = require('fs');
const https = require('https');
const configs = require('./oci-configuration').configs;
const log = require('./logger').l

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
        userId: configs.authUserId
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


function publishMessages(streamId, messages, callback) {
    var options = {
        host: configs.streamingAPIEndpoint,
        path: "/20180418/streams/" + encodeURIComponent(streamId) + "/messages",
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    };
    msg =
        {
            "messages":
                []
        };
    for (let i = 0; i < messages.length; i++) {
        msg.messages.push({ "key": "personal", "value": new Buffer(messages[i]).toString('base64') })
        console.log("Message: " + messages[i])
    }
    body = JSON.stringify(msg)
    var request = https.request(options, handleRequest(callback));
    signRequest(request, body);
    request.write(body)
    request.end();
};

function pubMessages(streamId, messages) {
    publishMessages(streamId, messages, function (data) {
        console.log("Messages Published to Stream.");
        log(JSON.stringify(data))
    });
    return { "Status": "OK" }
}

module.exports = {
    publish: pubMessages
}

// invoke with
// node stream-publisher 'My Messages - to be spread around!'

run2 = async function () {

    const input = { "streamId": process.env["streamId"], "messages": [process.argv[2]] }
    log("input: " + JSON.stringify(input))
    let response = pubMessages(input.streamId, input.messages)
    log("response: " + JSON.stringify(response))
}


run2()
