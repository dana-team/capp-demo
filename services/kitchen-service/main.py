import json
import logging
import os

from fastapi import FastAPI
from kafka import KafkaProducer
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO, format='{"level":"%(levelname)s","service":"kitchen-service","msg":"%(message)s"}')
log = logging.getLogger("kitchen-service")

app = FastAPI()

producer = KafkaProducer(
    bootstrap_servers=os.environ["KAFKA_BROKERS"].split(","),
    security_protocol="SASL_PLAINTEXT",
    sasl_mechanism=os.environ.get("KAFKA_SASL_MECHANISM", "PLAIN"),
    sasl_plain_username=os.environ["KAFKA_SASL_USER"],
    sasl_plain_password=os.environ["KAFKA_SASL_PASSWORD"],
    value_serializer=lambda v: json.dumps(v).encode("utf-8"),
)
STATUS_TOPIC = os.environ.get("KAFKA_STATUS_TOPIC", "order-status")


class Order(BaseModel):
    orderId: str
    item: str | None = None
    qty: int | None = None


@app.post("/", status_code=204)
def handle_order(order: Order):
    # delivered by the Capp KafkaSource consuming the "orders" topic
    log.info(f"cooking order {order.orderId}")
    status = {"orderId": order.orderId, "status": "ready"}
    producer.send(STATUS_TOPIC, status)
    producer.flush()
    log.info(f"order ready: {status}")


@app.get("/healthz")
def healthz():
    return "ok"
