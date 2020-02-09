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
            callback(JSON.responseBody ? parse(responseBody) : { "no": "contents" });
        });
    }
}

function postCustomMetrics(customMetrics, callback) {
    var options = {
        host: configs.telemetryIngstionAPIEndpoint,
        path: "/metrics",
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        }
    };

    var request = https.request(options, handleRequest(callback));
    let body = customMetrics
    log("Go Sign and Send Request")
    signRequest(request, body);
    request.write(body)
    delete options.body;
    request.end();
};



function metricsPublisher(metricsNamespace, resourceGroup, compartmentId, name, value, dimensionMap, metadataMap, nowDate = new Date()) {
    let customMetrics = {
        "metricData": [{
            "namespace": metricsNamespace,
            "resourceGroup": resourceGroup,
            "compartmentId": compartmentId,
            "name": name,
            "dimensions": dimensionMap,
            "metadata": metadataMap,
            "datapoints": [{
                "timestamp": (new Date()).toISOString(),
                "value": value
            }]
        }]
    }
    postCustomMetrics(customMetrics, function (data) {
        log(data);
    });
    return { "Status": "OK" }
}

module.exports = {
    metricsPublisher: metricsPublisher
}

// invoke on the command line with :
// node metricsPublisher '{"metricsNamespace":"mymetricsnamespace", "resourceGroup":"divisionX", "compartmentId":"OCID", "name":"customOrder", "value":1, "count":1,"dimensionMap":{"product":"doll","country":"IT"},"metadataMap":{"notes":"Valentine's Day"}}`

run = async function () {
    if (process.argv && process.argv[2]) {
        const input = JSON.parse(process.argv[2])
        log("input: " + JSON.stringify(input))
        let response = metricsPublisher(input.metricsNamespace, input.resourceGroup,
            input.name, input.value, input.dimensionMap, input.metadataMap)
        log("response: " + JSON.stringify(response))
    }
}

run()
