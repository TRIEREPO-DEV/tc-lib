module.exports = function (grunt) {
    var moduleName = 'tcLib';
    const sass = require('node-sass');

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        concat: {
            js: {
                src: ['./dist/src/scripts/tcLib.js', './dist/src/**/*.js'],
                dest: './dist/tc-lib.js'
            }
        },

        sass: {
            options: {
                implementation: sass,
                sourceMap: false
            },
            dist: {
                files: {
                    'dist/tc-lib.css': 'src/scss/tc-lib.scss'
                }
            }
        },

        cssbeautifier: {
            options: {
                indent: '  ',
                openbrace: 'end-of-line',
                autosemicolon: false
            },
            dist: {
                src: ["dist/tc-lib.css"]
            }
        },

        clean: {
            dist: ['./dist'],
            distSrc: ['./dist/src'],
        },

        uglify: {
            js: {
                src: ['./dist/tc-lib.js'],
                dest: './dist/tc-lib.min.js'
            }
        },

        cssmin: {
            target: {
                files: [{
                    expand: true,
                    cwd: './dist',
                    src: ['*.css', '!*.min.css'],
                    dest: './dist',
                    ext: '.min.css'
                }]
            }
        },

        ngtemplates: {
            options: {
                htmlmin: {
                    collapseBooleanAttributes: true,
                    collapseWhitespace: true,
                    removeAttributeQuotes: false,
                    removeComments: true,
                    removeEmptyAttributes: false,
                    removeRedundantAttributes: true,
                    removeScriptTypeAttributes: true,
                    removeStyleLinkTypeAttributes: true
                },
                bootstrap: function (module, script) {
                    var header = "angular.module(\'" + moduleName + "\').run(['$templateCache', function($templateCache) {\n";
                    var footer = "}]);\n";

                    var cwd = grunt.template.process('');
                    script = script.replace(new RegExp(cwd, 'g'), '');
                    script = script.replace(/(^|\n)[ \t]*('use strict'|"use strict");?\s*/g, '$1');
                    return grunt.template.process(header) + script + footer;
                }
            },
            app: {
                src: 'src/scripts/**/*.html',
                dest: 'dist/src/templates.js'
            }
        },

        ngAnnotate: {
            options: {
                singleQuotes: true
            },
            app: {
                files: [{
                    expand: true,
                    src: ['src/scripts/**/*.js'],
                    dest: './dist',
                }]
            }
        }
    });

    //load grunt tasks
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-ng-annotate');
    grunt.loadNpmTasks('grunt-sass');
    grunt.loadNpmTasks('grunt-cssbeautifier');
    grunt.loadNpmTasks('grunt-angular-templates');

    //register grunt default task
    grunt.registerTask('default', ['clean:dist', 'ngAnnotate', 'ngtemplates', 'concat', 'uglify', 'clean:distSrc', 'sass', 'cssbeautifier:dist', 'cssmin']);
    grunt.registerTask('build', ['clean:dist', 'ngAnnotate', 'ngtemplates', 'concat', 'uglify', 'clean:distSrc', 'sass', 'cssbeautifier:dist', 'cssmin']);
};
