module.exports = function (grunt) {
  require("load-grunt-tasks")(grunt);

  grunt.initConfig({
    concat: {
      options: {
        stripBanners: true,
        banner: "#!/usr/bin/env node\n\nprocess.title = 'batch-transcode-video';\n\n",
      },
      bin: {
        src: ['.tmp/batch-transcode-video.js'],
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
          src: ['index.js', 'index-cli.js', 'lib/**/*.js'],
          dest: 'dist/'
        }]
      },
      bin: {
        files: {
          '.tmp/batch-transcode-video.js': 'batch-transcode-video.js'
        }
      }
    },
    watch: {
      dist: {
        files: ['index.js', 'index-cli.js', 'lib/**/*.js'],
        tasks: ['babel:dist'],
        options: {
          spawn: false
        }
      },
      standalone: {
        files: ['batch-transcode-video.js'],
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

  grunt.registerTask('default', ['babel', 'concat']);
};
