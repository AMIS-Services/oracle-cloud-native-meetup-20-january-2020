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
        userId: configs.authUserId,
        "passphrase": configs.pass_phrase,
    }, body);
}
// generates a function to handle the https.request response object
function handleRequest(callback) {
    

    return function (response) {
        var responseBody = "";
        log(JSON.stringify(response.headers), "callback function defined in handleRequest")
        response.on('data', function (chunk) {
            responseBody += chunk;
        });

        response.on('end', function () {
            log(`Response Body ${JSON.responseBody} `,"callback function defined in handleRequest")
            callback(JSON.responseBody ? parse(responseBody) : { "no": "contents" });
        });
    }
}


function createFileObject(bucket, filename, contentsAsString, callback) {
    var options = {
        host: configs.objectStorageAPIEndpoint,
        path: "/n/" + encodeURIComponent(configs.namespaceName) + "/b/" + encodeURIComponent(bucket) + "/o/" + encodeURIComponent(filename),
        method: 'PUT',
        headers: {
            'Content-Type': 'text/plain',
        }
    };

    var request = https.request(options, handleRequest(callback));
    let body = contentsAsString
    log("Go Sign and Send Request")
    signRequest(request, body);
    request.write(body)
    delete options.body;
    request.end();
};

function wait (timeout) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve()
      }, timeout);
    });
  }

async function fileWriter(bucket, fileName, contents, nowDate = new Date()) {
    createFileObject(bucket, fileName, contents, function (data) {
        log(`Data returned from OCI REST API Call ${JSON.stringify(data)}`,"fileWriter");
    });
    await wait(3000);
    return { "Status": "OK" }
}

module.exports = {
    fileWriter: fileWriter
}

// invoke on the command line with :
// node fileWriter '{"bucket":"TOKEN","fileName":"secret2", "contents":{"File Contents":"Contents, Contents"}}'
const { execSync } = require('child_process');

function overrideNowBasedOnOS() {
    Date.now = function () {
        const osdate = execSync('date');
        const da = Date.parse(osdate)
        return da;
    }

}


run = async function () {
    const osdate = execSync('date');
    const d = Date.parse(osdate)
    const nowDate = new Date(d)
    if (d - Date.now() > 10000) {
        // in this case the mapping from system clock to Date() is corrupt somehow
        overrideNowBasedOnOS()
    }
    if (process.argv && process.argv[2]) {
        const input = JSON.parse(process.argv[2])
        var bucketName = process.env['bucketName']
        if (!bucketName) {
            log('No BucketName is defined; set environment variable bucketName to appropriate value')
        }
        log("input: " + JSON.stringify(input))
        let response = fileWriter(bucketName, input.fileName, JSON.stringify(input.contents))
        log("response: " + JSON.stringify(response))
    }
}

run()
