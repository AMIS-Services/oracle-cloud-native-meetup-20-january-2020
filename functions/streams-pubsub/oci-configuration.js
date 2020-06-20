const configs=
    {
        // this is where the JSON snippet goes - pasted from the command line result
    }

 module.exports = {
    configs : configs
};

// note:

// the content of the file after pasting in the JSON data should look like this:

// const configs=
//     {
//         namespaceName: `${process.env["ns"]}`,
//         region: `${process.env["REGION"]}`,
//         compartmentId: `${process.env["compartmentId"]}`, //lab-compartment
//         authUserId: `${process.env["USER_OCID"]}`,
//         identityDomain: `identity.${process.env["REGION"]}.oraclecloud.com`,
//         tenancyId: `${process.env["TENANCY_OCID"]}`,
//         keyFingerprint: "YOUR_FINGERPRINT_FROM FILE ./oci_api_key.pem",
//         privateKeyPath: "./oci_api_key.pem",
//         coreServicesDomain: `iaas.${process.env["REGION"]}.oraclecloud.com`,
//         bucketOCID: process.env['bucketOCID'],
//         bucketName:process.env['bucketName'],
//         objectStorageAPIEndpoint:`objectstorage.${process.env["REGION"]}.oraclecloud.com`,
//         streamingAPIEndpoint: `streaming.${process.env["REGION"]}.oci.oraclecloud.com` 
//     }
