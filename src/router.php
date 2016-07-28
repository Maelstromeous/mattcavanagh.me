<?php

use League\Container\Container;
use League\Container\ContainerInterface;
use League\Route\RouteCollection;

$router = new RouteCollection(
    isset($container) && $container instanceof ContainerInterface ? $container : new Container
);

$router->get('/', 'Mattcavanagh\Portfolio\Controller\MainController::index');
$router->get('/portfolio', 'Mattcavanagh\Portfolio\Controller\MainController::portfolio');

return $router;
