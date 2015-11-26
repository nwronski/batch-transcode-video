module.exports = function (grunt) {
  require("load-grunt-tasks")(grunt);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
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
        sourceMap: false,
        presets: ['es2015']
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
        tasks: ['babel:bin', 'concat:bin', 'replace:bin'],
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
    },
    replace: {
      options: {
        patterns: [
          {
            match: 'VERSION',
            replacement: '<%= pkg.version %>'
          }
        ]
      },
      bin: {
        files: [{
          expand: true,
          cwd: 'bin/',
          src: 'batch-transcode-video',
          dest: 'bin/'
        }]
      }
    }
  });

  grunt.registerTask('default', ['babel', 'concat', 'replace']);
};
