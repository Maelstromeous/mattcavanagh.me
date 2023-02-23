module.exports = function(grunt) {

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.initConfig({
        less: {
            development: {
                options: {
                    compress: true,
                    yuicomppress: true,
                    optimisation: 2
                },
                files: {
                    'public/assets/css/main.css': 'public/assets/less/main.less'
                }
            }
        },
        watch: {
            styles: {
                files: ['public/assets/less/**/*.less'],
                tasks: ['less'],
                options: {
                    nospawn: true
                }
            }
        }
    });

    grunt.registerTask('default', ['less', 'watch'] );
};