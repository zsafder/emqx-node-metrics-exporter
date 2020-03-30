const client = require('prom-client');
const express = require('express');
const server = express();
const register = new client.Registry();

client.collectDefaultMetrics({prefix: 'node_', timeout: 5000, register});
 
const endpoint = process.env.EMQX_ENDPOINT; 
const user = process.env.USERNAME;
const pass = process.env.PASSWORD;
const port = process.env.PORT;
const gaugeList = [];

server.get('/metrics', (req, res) => {
   queryMetrics()
   .then(data =>{
      var jsonObject = JSON.parse(data);
      var nodeMetrics = jsonObject.data[0].metrics;
      var keys = Object.keys(nodeMetrics) ;
      var values = Object.values(nodeMetrics) ;
      var metrics = [];
      const regex = /\./g;

      for (let i=0; i<keys.length; i++){       
         metrics[i] = keys[i].replace(regex, '_');
      }

      for (let i=0; i < metrics.length; i++){
         gaugeList[i].set(values[i]);
      }

   }).then((data)=> {
      res.set('Content-Type', register.contentType);
      res.end(register.metrics());
   }).catch((error) => {
      console.log("Error:: ", error);
   });
});

function queryMetrics() {
   var username = `${user}` , password = `${pass}` , auth = "Basic " + Buffer.from(username + ":" + password).toString("base64");
   var request = require('request');
   var url = `${endpoint}/api/v3/metrics/`;

   const options = {
       url : url,
       headers : {
           "Authorization" : auth
       }
   }
   return new Promise((resolve, reject) => {
       request.get( options, function(error, response, body) {
          if (!error && response.statusCode == 200) {
             resolve(body);
          }
          else if (response === undefined) {
             console.log("Error is http request!");
          }
       })
   });
}

function registerMetric() {
   return queryMetrics()
   .then(data =>{
      var jsonObject = JSON.parse(data);
      var nodeMetrics = jsonObject.data[0].metrics;
      var keys = Object.keys(nodeMetrics) ;
      var values = Object.values(nodeMetrics) ;
      var metrics = [];
      const regex = /\./g;

      for (let i=0; i<keys.length; i++){              
         metrics[i] = keys[i].replace(regex, '_');
      }
      
      for (let i=0; i < metrics.length; i++){
         gaugeList[i] = new client.Gauge({
            name: "node_"+ metrics[i] + "_metric_guage",
            help: metrics[i]
         });
         register.registerMetric(gaugeList[i]);
         gaugeList[i].set(values[i]);
      }

   })
}

registerMetric();

console.log('Server listening to ' + `${port}` + ', metrics exposed on /metrics endpoint');
server.listen(`${port}`); 