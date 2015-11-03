module.exports = function (grunt) {
  require("load-grunt-tasks")(grunt);

  grunt.initConfig({
    concat: {
      options: {
        stripBanners: true,
        banner: "#!/usr/bin/env node\n\nprocess.title = 'batch-transcode-video';\n\n",
      },
      bin: {
        src: ['.tmp/index.js'],
        dest: 'bin/batch-transcode-video',
      },
    },
    babel: {
      options: {
        sourceMap: false
      },
      dist: {
        files: [{
          expand: true,
          src: ['index.js', 'lib/**/*.js'],
          dest: 'dist/'
        }]
      },
      bin: {
        files: {
          '.tmp/index.js': 'index-standalone.js'
        }
      }
    },
    watch: {
      dist: {
        files: ['index.js', 'lib/**/*.js'],
        tasks: ['babel:dist'],
        options: {
          spawn: false
        }
      },
      standalone: {
        files: ['index-standalone.js'],
        tasks: ['babel:bin', 'concat:bin'],
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
