#!/bin/sh

echo "=============== STARTING SERVICES ==================="
sudo --preserve-env=ENVIRONMENT \
  --preserve-env=VERSION \
  --preserve-env=BASE_URL -u root runsvdir -P /etc/service