<?php

use League\Container\Container;

$container = new Container();

$container->addServiceProvider(Mattcavanagh\Portfolio\ServiceProvider\HttpMessageServiceProvider::class);
$container->addServiceProvider(Mattcavanagh\Portfolio\ServiceProvider\ConfigServiceProvider::class);

$container->inflector(Mattcavanagh\Portfolio\Contract\ConfigAwareInterface::class)
          ->invokeMethod('setConfig', ['config']);

$container->add(Mattcavanagh\Portfolio\Controller\MainController::class);

return $container;
