# Etapa de construcción
FROM node:20.13.1-bookworm-slim AS build
WORKDIR /app

# Instalar dependencias de Node.js
COPY package*.json ./
# Limpiar la caché de npm y luego instalar dependencias
RUN npm cache clean --force \
    && npm install --cache /tmp/empty-cache --prefer-online --production


# Copiar el código de la aplicación
COPY . .

# Configurar Puppeteer para usar un directorio de caché personalizado y omitir la descarga de Chromium
#ENV PUPPETEER_CACHE_DIR=/app/.cache/puppeteer
#ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Crear un usuario no root
#RUN useradd -ms /bin/bash puppeteeruser
RUN mkdir -p /app/.cache/puppeteer /app/.wwebjs_auth /app/.wwebjs_cache /app/app /app/logs

# Cambiar permisos de todo en /app excepto /node_modules
#RUN find /app -path /app/node_modules -prune -o -exec chown puppeteeruser:puppeteeruser {} +

# Etapa final
FROM node:20.13.1-bookworm-slim AS final
WORKDIR /app

# Actualiza los repositorios y systemd

# Instalar Chrome y dependencias en la etapa final
RUN apt-get update \
    && apt-get install -y curl gnupg ca-certificates sudo systemd procps --no-install-recommends \
    && curl -sSL https://dl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/google-linux-keyring.gpg \
    && echo "deb [signed-by=/usr/share/keyrings/google-linux-keyring.gpg arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable --no-install-recommends \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*


# Copiar solo los archivos necesarios desde la etapa de construcción
COPY --from=build /app /app

# Configurar Puppeteer para usar un directorio de caché personalizado y omitir la descarga de Chromium
#ENV PUPPETEER_CACHE_DIR=/app/.cache/puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Crear un usuario no root
RUN useradd -ms /bin/bash puppeteeruser

# Cambiar permisos de todo en /app excepto los directorios y archivos especificados

RUN find /app/* -mindepth 1 -maxdepth 1 -type d -prune -o -exec chown puppeteeruser:puppeteeruser {} + \
    && chown -R puppeteeruser:puppeteeruser /app/node_modules/whatsapp-web.js /app/node_modules/puppeteer/node_modules/puppeteer-core /app/.cache/puppeteer /app/.wwebjs_auth /app/.wwebjs_cache /app/app /app/logs

# Configurar el usuario
USER puppeteeruser

# Exponer puertos

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8080 4000 14119


ENTRYPOINT ["/entrypoint.sh"]



#CMD [ "node", "index.js" ]