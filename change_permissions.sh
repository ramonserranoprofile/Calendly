# change_permissions.sh
#!/bin/sh
find /app -name '*.zip' -exec chown puppeteeruser:puppeteeruser {} +