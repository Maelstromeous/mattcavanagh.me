<?php

use PHPUnit\Framework\TestCase;

class MainControllerTest extends TestCase
{
    public function testHelloWorld()
    {
        $string = 'hello';
        $string .= ' world!';

        $this->assertEquals('hello world!', $string);
    }
}
