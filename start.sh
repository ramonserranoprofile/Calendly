#!/bin/sh
set -e
# Cambiar el propietario de los archivos a nginx
#chown -R nginx:nginx /*

#bash -c '/root/Documents/chrome.sh'

# Activa el entorno virtual de Flask
# . /venv/bin/activate
cd /app
# Activa el entorno virtual de Express
node index.js

# gunicorn --bind 127.0.0.1:5000 process_form:app &
#flask --app=/app/process_form.py run &

# Activa el entorno virtual de NGINX
# nginx -g 'daemon off;'
# Activa el entorno virtual de NGINX