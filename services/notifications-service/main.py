import logging

from fastapi import FastAPI
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO, format='{"level":"%(levelname)s","service":"notifications-service","msg":"%(message)s"}')
log = logging.getLogger("notifications-service")

app = FastAPI()


class OrderStatus(BaseModel):
    orderId: str
    status: str


@app.post("/", status_code=204)
def handle_status(status: OrderStatus):
    # delivered by the Capp KafkaSource consuming the "order-status" topic; no Kafka client needed
    log.info(f"notifying customer: order {status.orderId} is {status.status}")


@app.get("/healthz")
def healthz():
    return "ok"
