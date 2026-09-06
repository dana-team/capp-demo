# Mac Dana

A small, fake burger-ordering app (order a burger, pick your add-ons) used to demo [Capp](https://github.com/dana-team/container-app-operator) features: scale-to-zero autoscaling, native Kafka/cron eventing (no client boilerplate), custom TLS routes, and centralized log shipping to Elastic.

## Architecture

```
                         +-------------+
   customer ----------> |  frontend    |  React SPA, public route + TLS
                         +------+------+
                    calls REST  |
                                v
                       +-----------------+
                       | orders-service   |  public route + TLS
                       +--------+--------+   <- PingSource cron: daily sales report (/report)
                        produces |
                                 v
                          Kafka topic: orders
                                 |
                        KafkaSource (native)
                                 v
                       +----------------+
                       | kitchen-service |  produces order-status
                       +--------+-------+
                                v
                       Kafka topic: order-status
                                 |
                        KafkaSource (native)
                                 v
                   +------------------------+
                   | notifications-service   |  pure consumer, zero Kafka client code
                   +------------------------+

   all 4 Capps -> LogSpec(elastic-datastream) -> Elasticsearch -> Kibana dashboard
```

| Service | Language | Purpose |
|---|---|---|
| `frontend` | React (Vite) + nginx | burger builder (pick your add-ons), calls `orders-service` directly from the browser |
| `orders-service` | Python / FastAPI | accepts orders, produces to Kafka `orders`; sink for a daily `PingSource` cron |
| `kitchen-service` | Python / FastAPI | `KafkaSource` sink for `orders`; produces `order-status` |
| `notifications-service` | Python / FastAPI | `KafkaSource` sink for `order-status`; no Kafka client at all |

**Note:** the operator's `KafkaSource` support (`kitchen-service`, `notifications-service`) only does SASL over plaintext, not SASL_SSL/TLS. Point `kafka.brokers` at a listener on your managed cluster that allows `SASL_PLAINTEXT`.

## Prerequisites

- `container-app-operator` installed on the cluster, with a `mac-dana` namespace (or pass `--create-namespace`)
- A managed Kafka cluster reachable from the cluster, with topics `orders` and `order-status` (or `auto.create.topics.enable=true`), and a `SASL_PLAINTEXT` listener
- A managed Elasticsearch cluster reachable from the cluster
- A container registry to push the 4 images to

## Build and push images

```bash
./build-and-push.sh
```

Builds and pushes all 4 images to `ghcr.io/dana-team/capp-demo/<service>:latest` (edit the script to point at your own registry).

## Deploy

Edit `chart/values.yaml` (images, hostnames, Kafka brokers/credentials, Elastic host/credentials), then:

```bash
helm install mac-dana chart/ --namespace mac-dana --create-namespace
```

## Demo script

1. `kubectl get capps -n mac-dana` - all 4 Ready, note the `Custom URL` / `AutoScale Type` columns.
2. Open the frontend URL, order a burger with a couple of add-ons - watch it flow through Kafka into `kitchen-service` then `notifications-service`, all visible as JSON log lines in Kibana filtered by `orderId`.
3. Stop sending traffic, watch `frontend`/`orders-service` scale to zero (`kubectl get pods -n mac-dana -w`); send traffic again and observe the cold start.
4. Push a new `orders-service` image, update `chart/values.yaml`, `helm upgrade`, and show the new Knative revision + traffic split/rollback via `routeSpec.trafficTarget`.
5. Wait for (or manually trigger) the `PingSource` cron and show the "daily sales report" log line appear with no user traffic involved.
