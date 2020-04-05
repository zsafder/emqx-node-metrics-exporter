const client = require('prom-client');
const express = require('express');
const server = express();
const register = new client.Registry();

client.collectDefaultMetrics({ prefix: 'node_', timeout: 5000, register });

var request = require('request');
var _metricsResult = [], _nodesResult = [], metricsData = [], clusterKeys = [], clusterValues = [];
const endpoint = process.env.EMQX_ENDPOINT; 
const emqxnode = process.env.EMQX_NODE;
const user = process.env.USERNAME, pass = process.env.PASSWORD, port = process.env.PORT;
const gaugeList = []
var metricValues = [];
var username = `${user}` , password = `${pass}` , auth = "Basic " + Buffer.from(username + ":" + password).toString("base64");

function queryMetrics() {
  var url = `${endpoint}/api/v3/nodes/${emqxnode}/metrics/`;
   const options = {
      url: url,
      headers: {
         "Authorization": auth
      }
   }
   return new Promise((resolve, reject) => {
      request.get(options, function (error, response, body) {
         if (!error && response.statusCode == 200) {
            _metricsResult = JSON.parse(body);
            resolve(_metricsResult);
         }
         else if (response === undefined) {
            console.log("Error in http request!");
            reject();
         }
      })
   })
   .then((data) => _metricsResult = data);
}

function queryNodes() {
   var url = `${endpoint}/api/v3/nodes/${emqxnode}`;
   const options = {
      url: url,
      headers: {
         "Authorization": auth
      }
   }
   return new Promise((resolve, reject) => {
      request.get(options, function (error, response, body) {
         if (!error && response.statusCode == 200) {
            _nodesResult = JSON.parse(body);
            _nodesResult = JSON.parse(body);
            resolve(_nodesResult);
         }
         else if (response === undefined) {
            console.log("Error in http request!");
            reject();
         }
      })
   })
   .then((data) => _nodesResult = data);
}

function combineMetrics() {
   var metricKeys = [], nodesData = [], count = 0;
   const regex = /\./g;
   var nodeKeys = ["connections", "memory_total", "memory_used", "process_available", "process_used", "node_status"];

   metricsData = _metricsResult.data;
   if (_nodesResult.data["node_status"] == "Running") {
      count += 1;
   }

   for (let j = 0; j < (nodeKeys.length); j++) {
      nodesData.push(parseFloat(_nodesResult.data[nodeKeys[j]])); 
   }

   if (count == 1) {
      nodesData[nodeKeys.indexOf("node_status")] = 1;
   }
   else {
      nodesData[nodeKeys.indexOf("node_status")] = 0;
   }

   var keys = Object.keys(metricsData);

   metricValues = Object.values(metricsData);
   for (let i = 0; i < keys.length; i++) {
      metricKeys[i] = keys[i].replace(regex, '_');
   }

   clusterKeys = [...metricKeys, ...nodeKeys];
   clusterValues = [...metricValues, ...nodesData];
}

function guageGenerator() {
   for (let i = 0; i < clusterKeys.length; i++) {
      gaugeList[i] = new client.Gauge({
         name: "node_" + clusterKeys[i] + "_metric_guage",
         help: clusterKeys[i]
      });
      register.registerMetric(gaugeList[i]);
      gaugeList[i].set(clusterValues[i]);
   }
}

function fillGuage() {
   for (let i = 0; i < clusterKeys.length; i++) {
      gaugeList[i].set(clusterValues[i]);
   }
}

function handleSuccess(res) {
   res.set('Content-Type', register.contentType);
   res.end(register.metrics());
}

function handleFailure(res, error) {
   res.status(500);
   res.end(error);
}

server.get('/metrics', (req, res) => {       // Fetches and sets latest metric-values to Guages
   queryMetrics()
      .then(() => queryNodes())
      .then(() => combineMetrics())
      .then(() => fillGuage())
      .then(() => handleSuccess(res))
      .catch((error) => handleFailure(res, error));
});

function registerMetric() {         
   return queryMetrics()
      .then(() => queryNodes())
      .then(() => combineMetrics())
      .then(() => guageGenerator())
}

registerMetric();       // Registers the metrics for /metrics & /nodes APIs 

console.log('Server listening to ' + `${port}` + ', metrics exposed on /metrics endpoint');
server.listen(`${port}`); 
