const fdk=require('@fnproject/fdk');
const metricsPublisher=require('./metricsPublisher')
fdk.handle(function(input){
  const x = metricsPublisher.metricsPublisher(input.metricsNamespace, input.resourceGroup, input.compartmentId,
    input.name, input.value,input.dimensionMap, input.metadataMap)
  return x
})



// invoke with :
// echo -n '{"metricsNamespace":"mymetricsnamespace", "resourceGroup":"divisionX","compartmentId":"OCID", "name":"customOrder", "value":1, "count":1,"dimensionMap":{"product":"doll","country":"IT"},"metadataMap":{}}' | fn invoke lab-app metrics-publisher

// deploy with :
// fn deploy --app lab-app 