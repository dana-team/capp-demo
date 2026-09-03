import json
import logging
import os
import time
import uuid

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from kafka import KafkaProducer
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO, format='{"level":"%(levelname)s","service":"orders-service","msg":"%(message)s"}')
log = logging.getLogger("orders-service")

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get("FRONTEND_ORIGIN", "*")],
    allow_methods=["POST"],
    allow_headers=["Content-Type"],
)

producer = KafkaProducer(
    bootstrap_servers=os.environ["KAFKA_BROKERS"].split(","),
    security_protocol="SASL_PLAINTEXT",
    sasl_mechanism=os.environ.get("KAFKA_SASL_MECHANISM", "PLAIN"),
    sasl_plain_username=os.environ["KAFKA_SASL_USER"],
    sasl_plain_password=os.environ["KAFKA_SASL_PASSWORD"],
    value_serializer=lambda v: json.dumps(v).encode("utf-8"),
)
ORDERS_TOPIC = os.environ.get("KAFKA_ORDERS_TOPIC", "orders")


class OrderRequest(BaseModel):
    item: str
    qty: int = 1


@app.post("/orders", status_code=201)
def create_order(body: OrderRequest):
    order = {
        "orderId": str(uuid.uuid4()),
        "item": body.item,
        "qty": body.qty,
        "createdAt": time.time(),
    }
    producer.send(ORDERS_TOPIC, order)
    producer.flush()
    log.info(f"order created: {order}")
    return order


@app.post("/report", status_code=204)
def daily_report():
    # sink for the Capp PingSource cron trigger
    log.info("daily sales report generated")


@app.get("/healthz")
def healthz():
    return "ok"
