<?php

namespace Mattcavanagh\Portfolio\ServiceProvider;

use League\Container\ServiceProvider\AbstractServiceProvider;

class ConfigServiceProvider extends AbstractServiceProvider
{
    /**
     * @var array
     */
    protected $provides = ['config'];

    /**
     * @{inheritDoc}
     */
    public function register()
    {
        $this->getContainer()->share('config', function() {
            $version = $_ENV['ENVIRONMENT'] === 'development' ? rand() : $_ENV['VERSION'];
            return [
                'environment' => $_ENV['ENVIRONMENT'],
                'base_url'    => $_ENV['BASE_URL'],
                'asset_url'   => $_ENV['BASE_URL'] . '/assets',
                'version'     => "?v={$version}"
            ];
        });
    }
}
