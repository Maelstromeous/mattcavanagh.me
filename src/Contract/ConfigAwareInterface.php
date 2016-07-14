<?php

namespace Mattcavanagh\Portfolio\Contract;

interface ConfigAwareInterface
{
    public function setConfig(array $config);

    public function getConfig();
}
