# emqx-node-metrics-exporter
Emqx Node Metrics Exporter in Prometheus Format
 
  A server that scrapes EMQX v3 metrics of any single node and exports them via HTTP for Prometheus consumption.

## Getting Started

## Installation through Docker
To run EMQX exporter as a Docker container, run;
```
docker run -d --restart unless-stopped -p 9001:9001 --name eqmx-node-metrics-exporter  -e PORT='9001' -e USERNAME=<'username'> -e PASSWORD=<'password'> -e EMQX_NODE=<"emqx@xxx.xx.xx.xxx"> -e EMQX_ENDPOINT=<"http://<emqx-ip>:18083">  zeeshansafder/eqmx-node-metrics-exporter
``` 
This hits your specific emqx node and scrape the metrics from /api/v3/nodes/emqxnode/metrics & /api/v3/nodes/emqxnode APIS

### EMQX URL
Specify EMQX's node url and api port using the -e EMQX_ENDPOINT . For example;
```
-e EMQX_ENDPOINT=<"http://xx.xx.xxx.xxx:18083">
```
### EMQX Node
Specify EMQX's node you want to get metrics of. For example;
```
-e EMQX_NODE=<"emqx@xxx.xx.xx.xxx">
```
### EMQX Credentials
Specify EMQX's credentials as;
 ``` 
-e USERNAME = ‘admin’ 
-e PASSWORD= ‘public’
```
## Results
Results can be seen at  ```http://localhost:<'port'>/metrics ```
