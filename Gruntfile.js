'use strict';
module.exports = function(grunt) {
    grunt.initConfig( {
        less: {
            development: {
                files: {
                    'public/assets/css/compiled/main.css' : 'public/assets/less/main.less'
                }
            }
        },
        concat: {
            css: {
                src: [
                    'public/assets/css/compiled/main.css',
                ],
                dest: 'public/assets/css/main.min.css'
            },
            js: {
                src: [
                    'public/bower_components/jquery/dist/jquery.min.js',
                    'public/bower_components/bootstrap/dist/js/bootstrap.min.js'
                ],
                dest: 'public/assets/js/main.min.js'
            }
        },
        watch: {
            less: {
                files: ['public/assets/less/**/*.less'],
                tasks: ['css'],
                options: {
                    nospawn: true
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
};
