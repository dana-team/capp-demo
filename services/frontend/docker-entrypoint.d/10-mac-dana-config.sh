#!/bin/sh
set -eu
echo "window.ORDERS_SERVICE_URL = \"${ORDERS_SERVICE_URL}\";" > /usr/share/nginx/html/config.js
