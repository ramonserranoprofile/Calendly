# Etapa de construcción: construye la aplicación Flask y Express
FROM node:18.20.3 AS build
WORKDIR /app

# Instala las dependencias de Express
COPY package.json package-lock.json ./
RUN npm install

# Copia todos los archivos de las aplicaciones Flask y Express
COPY . ./

# Segunda etapa de construcción para Flask
FROM python:3.10-slim AS flask
WORKDIR /app

# Instala las dependencias de Python y venv
RUN apt-get update && apt-get install -y python3-pip python3-venv
# Instala las dependencias de Flask
COPY requirements.txt ./
# Crea un entorno virtual y instala las dependencias de Flask
RUN python3 -m venv venv
RUN venv/bin/pip install -r requirements.txt

# Copia todos los archivos de la aplicación Flask
COPY . ./

# Configura el puerto en el que Flask va a correr (opcional)
ENV FLASK_APP=process_form.py
ENV FLASK_RUN_HOST=0.0.0.0
ENV FLASK_RUN_PORT=5000

# Configura NGINX
FROM nginx:latest
WORKDIR /app
COPY --from=build /app ./
COPY --from=flask /app ./
COPY nginx.conf /etc/nginx/nginx.conf

# Exponer puertos para Flask y Express
EXPOSE 5000 4000 80

# Copia el script de inicio
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Comando para iniciar NGINX, Flask y Express
CMD ["/start.sh"]