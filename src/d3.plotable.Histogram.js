/*
 * d3.plotable.Histogram
 *
 * d3.plotable which draws a histogram.
 *
 * Data API
 * --------
 * The data object is an array of objects, each of which must contain the
 * followings keys:
 *
 * * `xlow`: Lower edge of the bin
 * * `xhigh`: Upper edge of the bin
 * * `y`: Contents of the bin
 *
 * The other optional keys per object are:
 *
 * * `yerr`: Uncertainty on `y`
 *
 * Configuration
 * -------------
 * The possible configuration keys are:
 *
 * * `color`: The color of the histogram line as a CSS-compatiable string
 *            (default: '#261196')
 */
(function(d3, undefined) {
  'use strict';
  var Histogram = function(name, data, config) {
    if (config === undefined) {
      config = {};
    }
    // Check the configuration for allowed keys
    if (config.color === undefined) {
      config.color = '#261196';
    }
    return {
      name: name,
      data: data,
      color: config.color,
      xDomain: function() {
        // The lowest xlow and the highest xhigh define the extent in x.
        // Add a 5% padding around the extent for aesthetics.
        var xExtent = d3.extent(this.data, function(d) { return d.xlow; }),
            dxExtent = d3.extent(this.data, function(d) { return d.xhigh; }),
            xPadding = 0.05*Math.abs(xExtent[0] - xExtent[1]);
        return [xExtent[0] - xPadding, dxExtent[1] + xPadding];
      },
      yDomain: function() {
        // Add a 5% padding at the top of the y extent
        var yExtent = d3.extent(this.data, function(d) { return d.y; });
        return [yExtent[0], 1.05*yExtent[1]];
      },
      draw: function(axes, g, transition) {
        if (arguments.length === 0) {
          console.error('Cannot draw ' + this.name + ', no arguments given');
          return;
        }
        if (transition === undefined) {
          transition = false;
        }
        g.classed('Histogram', true);
        var linearea = d3.svg.area()
              .interpolate('step-before')
              .x(function(d) { return axes.xScale(d.xhigh); })
              .y1(function(d) { return axes.yScale(d.y); })
              .y0(function(d) { return d3.max(axes.yScale.range()); }),
            join = g.selectAll('path').data([this.data]),
            selection = transition === true ? join.transition().duration(250) : join;
        join.enter()
          .append('path')
          .classed('line', true)
          .attr('fill', 'none')
          .attr('stroke', this.color);
        selection.attr('d', linearea);
      }
    };
  };

  d3.plotable = d3.plotable || {};
  d3.plotable.Histogram = Histogram;
})(window.d3);
