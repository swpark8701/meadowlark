/**
 * Created by sewonpark on 2016-02-02.
 */
module.exports = function(grunt){

    //Load Plugins
    [
        'grunt-cafe-mocha',
        'grunt-contrib-jshint',
        'grunt-exec'
    ].forEach(function(task){
       grunt.loadNpmTasks(task);
    });

    //Setting Plugins
    grunt.initConfig({

        cafemocha: {
            all:{src : 'site/qa/tests-*.js', options: {ui: 'tdd'}}
        },
        jshint: {
            app: ['site/meadowlark.js', 'site/public/js/**/*.js', 'lib/**.*.js'],
            qa: ['Gruntfile.js', 'site/public/qa/**/*.js', 'site/qa/**/*.js']
        },
        exec: {
            linkchecker: {cmd: 'linkcheck http://localhost:3000'}
        }

    });

    grunt.registerTask('default', ['cafemocha', 'jshint', 'exec']);

};