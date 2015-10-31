module.exports = function (grunt) {
  require("load-grunt-tasks")(grunt);

  grunt.initConfig({
    babel: {
      options: {
        sourceMap: true,
        presets: ['es2015']
      },
      dist: {
        files: [{
          expand: true,
          src: ['index.js', 'lib/**/*.js'],
          dest: 'dist/'
        }]
      }
    },
    watch: {
      dist: {
        files: ['index.js', 'lib/**/*.js'],
        tasks: ['babel'],
        options: {
          spawn: false
        }
      },
      config: {
        files: ['Gruntfile.js'],
        tasks: [],
        options: {
          reload: true
        }
      }
    }
  });

  grunt.registerTask('default', ['babel']);
};
