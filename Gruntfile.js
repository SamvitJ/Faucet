/**
 *  @References
 * [0] http://gruntjs.com/getting-started to install grunt-cli
 * [1]: https://github.com/01org/grunt-zipup
 * [2]: https://github.com/gruntjs/grunt-contrib-handlebars
 * [3]: http://gruntjs.com/configuring-tasks#files
 **/

module.exports = function (grunt) {

  grunt.initConfig({
    zipup: {
      package: {
        appName: 'Requestly',
        version: '3.3.6',
        files: [
          { cwd: 'src', src: ['**', '!pages/**/*.hbs'], expand: true, dest: 'src' },
          { cwd: 'resources', src: '**', expand: true, dest: 'resources' },
          { src: 'manifest.json'}
        ],
        outDir: 'build'
      }
    },

    /**
     * Task handlebars: Pre-Compile template files, concat them and save output to templates.hbs.js
     */
    handlebars: {
      compile: {
        options: {
          namespace: 'RQ.Templates',
          processName: function(filePath) {
            var pieces = filePath.split('/'),
              fileName = pieces[ pieces.length - 1 ];

            return fileName.replace(/(\.hbs)/ig, '');
          }
        },
        files: {
          'src/pages/templates.hbs.js': 'src/pages/templates/*.hbs'
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-zipup');
  grunt.loadNpmTasks('grunt-contrib-handlebars');

  grunt.registerTask('build', ['handlebars', 'zipup']);
  grunt.registerTask('templates', ['handlebars']);
};