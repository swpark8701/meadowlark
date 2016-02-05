/**
 * Created by sewonpark on 2016-02-02.
 */
module.exports = function(grunt){

    //Load Plugins
    [
        'grunt-cafe-mocha',
        'grunt-contrib-jshint',
        'grunt-exec',
        'grunt-contrib-sass',
        'grunt-contrib-uglify',
        'grunt-contrib-cssmin',
        'grunt-hashres',
        'grunt-lint-pattern'
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

        uglify: {
            all: {
                files:{
                    'site/public/js/meadowlark.min.js' : ['site/public/js/**/*.js']
                }
            }
        },
        sass: {
            development:{

                files:{
                    'site/public/css/main.css' : 'site/sass/main.scss',
                    'site/public/css/cart.css' : 'site/sass/cart.scss'
                }
            }
        },
        cssmin:{
            combine:{
                files:{
                    'site/public/css/meadowlark.css' : ['site/public/css/**/*.css', 'site/!public/css/meadowlark*.css']
                }
            },
            minify:{
                src: 'site/public/css/meadowlark.css',
                dest: 'site/public/css/meadowlark.min.css'
            }
        },
        hashres: {
            options: {
                fileNameFormat: '${name}.${hash}.${ext}'
            },
            all: {
                src: [
                    'site/public/js/meadowlark.min.js',
                    'site/public/css/meadowlark.min.css'
                ],
                dest: [
                    'site/config.js'
                ]
            }
        },
        exec: {
            linkchecker: {cmd: 'linkcheck http://localhost:3000'}
        },
        lint_pattern: {
            view_statics: {
                options: {
                    rules: [
                        {
                            pattern: /<link [^>]*href=["'](?!\{\{|(https?:)?\/\/)/,
                            message: 'Un-mapped static resource found in <link>.'
                        },
                        {
                            pattern: /<script [^>]*src=["'](?!\{\{|(https?:)?\/\/)/,
                            message: 'Un-mapped static resource found in <script>.'
                        },
                        {
                            pattern: /<img [^>]*src=["'](?!\{\{|(https?:)?\/\/)/,
                            message: 'Un-mapped static resource found in <img>.'
                        },
                    ]
                },
                files: {
                    src: [ 'site/views/**/*.hbs' ]
                }
            },
            css_statics: {
                options: {
                    rules: [
                        {
                            pattern: /url\(/,
                            message: 'Un-mapped static found in sass property.'
                        },
                    ]
                },
                files: {
                    src: [
                        '/site/sass/**/*.scss'
                    ]
                }
            }
        }

    });

    grunt.registerTask('default', ['cafemocha', 'jshint', 'exec', 'lint_pattern']);

    grunt.registerTask('static', ['sass', 'cssmin', 'uglify', 'hashres']);

};