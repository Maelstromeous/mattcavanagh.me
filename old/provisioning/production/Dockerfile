FROM maelstromeous/mattcavanagh:base

ARG VERSION="foo"
ENV VERSION="$VERSION"

USER www-data

COPY provisioning/production/files/nginx /etc/nginx/conf.d
COPY --chown=www-data:www-data ./site /var/www/html

RUN composer install -o --no-progress --no-dev --no-suggest
