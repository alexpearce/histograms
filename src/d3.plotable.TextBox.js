/*
 * d3.plotable.TextBox
 *
 * d3.plotable which draws a box containg key-value pairs of information.
 * Each pair is displayed on a single line, with the key justified to the left,
 * and the value justified on the right.
 *
 * Data API
 * --------
 * The data object is an array of arrays, each of which must contain two items:
 * a 'key', index 0, and a 'value', index 1.
 * Both the 'key' and the 'value' are allowed to be empty strings.
 * Be aware that the 'value' is best specified as a string, otherwise the value
 * will be transformed via toString, possibly leading to undesirable formatting.
 *
 * Example:
 *
 *   [['Name', 'My Thing'], ['Mean', '0.456'], ['RMS', '1.0']]
 *
 * Configuration
 * -------------
 * The possible configuration keys are:
 *
 * * `color`: The color of the text as a CSS-compatible string
 *            (default: '#000000')
 * * `x`: Initial position of the top-left corner of the box along x in px
 *        (default: 10)
 * * `y`: Initial position of the top-left corner of the box along y in px
 *        (default: 10)
 */
(function(d3, undefined) {
  'use strict';
  var TextBox = function(name, data, config) {
    if (config === undefined) {
      config = {};
    }
    if (config.color === undefined) {
      config.color = '#000000';
    }
    if (config.x === undefined) {
      config.x = 70;
    }
    if (config.y === undefined) {
      config.y = 20;
    }
    return {
      name: name,
      data: data,
      xDomain: function() { return []; },
      yDomain: function() { return []; },
      draw: function(axes, g, transition) {
        if (arguments.length === 0) {
          console.error('Cannot draw ' + this.name + ', no arguments given');
          return;
        }
        if (transition === undefined) {
          transition = false;
        }
        g.classed('TextBox', true);
        // Create 'background' rectangle
        var width = 150,
            height = this.data.length*20 + 10;
        g.selectAll('rect').data([null]).enter()
          .append('rect')
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', width)
          .attr('height', height)
          .style('fill', '#ffffff')
          .style('stroke', '#000000')
          .style('stroke-width', '1px');
        // Create join data, one <text> element per datum
        var join = g.selectAll('g').data(this.data);
        join.enter().append('g')
          .classed('legend-item', true)
          .attr('transform', function(d, i) { return 'translate(0,' + (20 + i*20) + ')'; });
        join.selectAll('text').data(function(d) { return d; })
          .enter()
          .append('text')
          // Align the key value to the left, value to right, padded by 5px
          .attr('x', function(d, i) { return [5, width - 5][i]; })
          .attr('text-anchor', function(d, i) { return ['start', 'end'][i]; })
          .style('fill', config.color)
          .text(function(d) { return d; });
        // Set up dragging on the container element
        var initPosition = g.data()[0] === undefined ? [{x: config.x, y: config.y}] : g.data();
        g.data(initPosition);
        g.attr('transform', 'translate(' + initPosition[0].x + ',' + initPosition[0].y + ')');
        var drag = d3.behavior.drag()
          .origin(function(d, i) { return d; })
          .on('drag', function (d, i) {
            d3.select(this)
              .attr('transform', 'translate(' + (d.x = d3.event.x) + ',' + (d.y = d3.event.y) + ')');
          });
        g.call(drag);
        return;
      }
    };
  };

  d3.plotable = d3.plotable || {};
  d3.plotable.TextBox = TextBox;
})(window.d3);
