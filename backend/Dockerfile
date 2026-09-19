# Laravel API — production image for Railway
FROM php:8.3-cli

# PHP extensions: pdo_mysql (DB), gd + mbstring (mPDF), zip + gd (Laravel Excel)
COPY --from=mlocati/php-extension-installer:latest /usr/bin/install-php-extensions /usr/bin/
RUN install-php-extensions pdo_mysql gd zip mbstring bcmath intl exif

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Install PHP deps first (better layer caching)
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --no-interaction --prefer-dist

# App source
COPY . .
RUN composer dump-autoload --optimize --no-dev \
    && chmod -R 775 storage bootstrap/cache

# Railway provides $PORT at runtime. Migrations run as the pre-deploy command
# (see railway.json), so the start command only boots the server.
EXPOSE 8080
CMD ["sh", "-c", "php artisan serve --host 0.0.0.0 --port ${PORT:-8080}"]
