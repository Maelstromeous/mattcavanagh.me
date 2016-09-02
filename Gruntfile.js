'use strict';
module.exports = function(grunt) {
    grunt.initConfig( {
        less: {
            development: {
                files: {
                    'public/assets/compiled/main.css' : 'public/assets/less/main.less'
                }
            }
        },
        concat: {
            css: {
                src: [
                    'bower_components/bootsrap/dist/css/bootstrap.min.css',
                    'bower_components/font-awesome/css/font-awesome.min.css',
                    'public/assets/compiled/main.css',
                ],
                dest: 'public/assets/dist/main.min.css'
            },
            js: {
                src: [
                    'bower_components/jquery/dist/jquery.min.js',
                    'bower_components/bootstrap/dist/js/bootstrap.min.js'
                ],
                dest: 'public/assets/dist/main.min.js'
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
            },
            js: {
                files: ['public/assets/js/**/*.js'],
                tasks: ['js'],
                options: {
                    nospawn: true,
                    atBegin: true
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', [
        'css'
    ]);

    grunt.registerTask('css', [
        'less',
        'concat:css',
        'concat:js'
    ]);
    grunt.registerTask('js', [
        'concat:js'
    ]);
};
