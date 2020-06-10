# Dev base image built locally
FROM mattcavanagh:base

USER root

RUN curl -sL https://deb.nodesource.com/setup_11.x | sudo -E bash -

RUN apt-get update \
    && apt-get install -y \
        nodejs \
        htop \
        nano \
    && rm -rf /var/lib/apt/lists/*

# Install grunt so we can process the LESS files automatically
RUN mkdir -p /var/www/.npm \
    && chown www-data: /var/www/.npm \
    && npm install -g grunt-cli

# Inject configs
COPY files/nginx /etc/nginx/conf.d
COPY files/php /usr/local/etc/php/conf.d
COPY files/php-fpm /usr/local/etc/php-fpm.d

USER www-data