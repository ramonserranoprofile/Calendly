# Etapa de construcción: construye la aplicación Flask y Express
FROM node:18.20.3 AS build
WORKDIR /app

# Instala las dependencias de Express
COPY package.json package-lock.json ./
RUN rm -rf node_modules
RUN npm install

# Copia todos los archivos de las aplicaciones Flask y Express
COPY . ./

# Configura Express (ajusta según tu script de inicio)
CMD ["node", "index.js"]

# Segunda etapa de construcción para Flask
FROM python:3.9-slim AS flask
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

# Comando para iniciar la aplicación Flask
CMD ["flask", "run"]

# Etapa de producción: sirve las aplicaciones con NGINX como proxy reverso
FROM nginx:latest
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app /usr/share/nginx/html/
EXPOSE 8000
CMD ["nginx", "-g", "daemon off;"]