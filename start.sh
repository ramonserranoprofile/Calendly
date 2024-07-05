#!/bin/sh

# Inicia el servidor Flask en segundo plano
. /app/venv/bin/activate
flask run &

# Inicia el servidor Express en segundo plano
node /app/index.js &

# Inicia NGINX
nginx -g "daemon off;"