/**
 * Created by cquach on 11-11-15.
 */
'use strict';

module.exports = function (grunt) {
    require('jit-grunt')(grunt, {
        'configureProxies': 'grunt-connect-proxy'
    });

    var serveStatic = require('serve-static');

    grunt.initConfig({
        watch: {
            livereload: {
                options: {
                    livereload: true
                },
                files: [
                    './{,*/**/}*.html',
                    './{,*/**/}*.css',
                    './{,*/**/}*.js'
                ]
            }
        },
        connect: {
            options: {
                port: 9000,
                // Change this to '0.0.0.0' to access the server from outside.
                hostname: '0.0.0.0'
            },
            proxies: [
                {
                    context: '/api',
                    host: 'rpi-master',
                    port: '8080',
                    https: false,
                    changeOrigin: false,
                    xforward: false
                }
            ],
            livereload: {
                options: {
                    open: false,
                    livereload: 35729,
                    middleware: function (connect) {
                        return [
                            require('grunt-connect-proxy/lib/utils').proxyRequest,
                            serveStatic('.')
                        ];
                    }
                }
            }
        }
    });

    grunt.registerTask('serve', [
        'configureProxies',
        'connect:livereload',
        'watch'
    ]);
};
