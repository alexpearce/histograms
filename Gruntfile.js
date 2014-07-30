module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    // Concatenate all our source JavaScript files in to one, placed in dist/
    concat: {
      options: {
        separator: ';'
      },
      dist: {
        src: [
          'src/d3.chart.utilities.js',
          'src/d3.chart.BaseChart.js',
          'src/d3.chart.AxesChart.js',
          'src/d3.plotable.TextBox.js',
          'src/d3.plotable.Histogram.js',
          'src/d3.plotable.Histogram2D.js'
        ],
        dest: 'dist/<%= pkg.name %>.js'
      }
    },
    // Minify the result of the concatenation, creating an additional file
    uglify: {
      options: {
        banner: '/* <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
      },
      dist: {
        files: {
          'dist/<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']
        }
      }
    },
    // Check all JavaScript files for proper syntax
    jshint: {
      files: ['Gruntfile.js', 'src/*.js'],
      options: {
        // Tell JSHint about global vars; console is read-only, module is not
        globals: {
          console: false,
          module: true
        }
      }
    },
    // Run JSHint on files changes
    watch: {
      files: ['<%= jshint.files %>'],
      tasks: ['jshint', 'concat', 'uglify']
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('default', ['jshint', 'concat', 'uglify']);
};
