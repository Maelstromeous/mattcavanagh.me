FROM maelstromeous/applications:mattcavanagh-base

USER www-data

COPY provisioning/staging/files/nginx /etc/nginx/conf.d
COPY --chown=www-data:www-data ./site /var/www/html

RUN composer install -o --no-progress --no-dev --no-suggest