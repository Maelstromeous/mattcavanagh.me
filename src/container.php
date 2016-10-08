<?php

use League\Container\Container;

$container = new Container();

$container->addServiceProvider(Mattcavanagh\Portfolio\ServiceProvider\ConfigServiceProvider::class);
$container->addServiceProvider(Mattcavanagh\Portfolio\ServiceProvider\HttpMessageServiceProvider::class);
$container->addServiceProvider(Mattcavanagh\Portfolio\ServiceProvider\TemplateServiceProvider::class);

$container->inflector(Mattcavanagh\Portfolio\Contract\ConfigAwareInterface::class)
          ->invokeMethod('setConfig', ['config']);
$container->inflector(Mattcavanagh\Portfolio\Contract\TemplateAwareInterface::class)
          ->invokeMethod('setTemplateDriver', ['Twig_Environment']);

$container->add(Mattcavanagh\Portfolio\Controller\MainController::class);
$container->add(Mattcavanagh\Portfolio\Controller\PortfolioController::class);

return $container;
