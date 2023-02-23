FROM php:7.4-fpm

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        sudo \
        runit \
        nginx \
        git \
        unzip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* /var/cache/apk/*
RUN docker-php-ext-install -j$(nproc) \
    opcache
RUN curl -sS https://getcomposer.org/installer | php
RUN mv composer.phar /usr/local/bin/composer \
    && mkdir /var/www/.composer \
    && chown -R www-data: /var/www/.composer

# Add www-data to sudoers
RUN adduser www-data sudo \
    && echo '%sudo ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

# Change UID & GID to match users
RUN usermod -u 1000 www-data \
    && groupmod -g 1000 www-data

# Run services
COPY ./files/runit /etc/service
COPY ./files/entrypoint.sh /usr/sbin/
ENTRYPOINT /usr/sbin/entrypoint.sh

# Inject config files
COPY ./files/nginx /etc/nginx/global
COPY ./files/php /usr/local/etc/php/conf.d
COPY ./files/php-fpm /usr/local/etc/php-fpm.d

USER www-data
WORKDIR /var/www/html