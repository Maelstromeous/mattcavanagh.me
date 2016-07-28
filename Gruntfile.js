'use strict';
module.exports = function(grunt) {
    grunt.initConfig( {
        concat: {
            css: {
                src: [
                    'public/bower_components/bootstrap/dist/css/bootstrap.min.css',
                    'public/assets/compiled/less.css',
                ],
                dest: 'public/assets/compiled/main.css'
            },
            js: {
                src: [
                    'public/bower_components/jquery/dist/jquery.min.js',
                    'public/bower_components/bootstrap/dist/js/bootstrap.min.js'
                ],
                dest: 'public/assets/compiled/main.min.js'
            }
        },
        cssmin: {
            options: {
                shorthandCompacting: true,
                roundingPrecision: -1,
                keepSpecialComments: 0
            },
            target: {
                files: {
                    'public/assets/compiled/main.min.css': ['public/assets/compiled/main.css']
                }
            }
        },
        less: {
            development: {
                files: {
                    'public/assets/compiled/less.css' : 'public/assets/less/main.less'
                }
            }
        },
        watch: {
            less: {
                files: ['public/assets/less/**/*.less'],
                tasks: ['css'],
                options: {
                    nospawn: true,
                    atBegin: true
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', [
        'css',
        'js'
    ]);

    grunt.registerTask('css', [
        'less',
        'concat:css',
        'cssmin'
    ]);

    grunt.registerTask('js', [
        'concat:js',
    ]);
};
