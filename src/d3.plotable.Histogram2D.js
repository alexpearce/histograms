/*
 * d3.plotable.Histogram2D
 *
 * d3.plotable which draws a two-dimensional histogram.
 * It is assumed that all bins contain positive values.
 * Bins with no content are drawn with no fill.
 *
 * Data API
 * --------
 * The data object is an array of objects, each of which must contain the
 * followings keys:
 *
 * * `xlow`: Lower x-edge of the bin
 * * `xhigh`: Upper x-edge of the bin
 * * `ylow`: Lower y-edge of the bin
 * * `yhigh`: Upper y-edge of the bin
 * * `z`: Contents of the bin
 *
 * The other optional keys per object are:
 *
 * * `zerr`: Uncertainty on `z`
 *
 * Configuration
 * -------------
 * There are no supported configuration keys.
 */
(function(d3, undefined) {
  'use strict';
  var Histogram2D = function(name, data, config) {
    if (config === undefined) {
      config = {};
    }
    return {
      name: name,
      data: data,
      xDomain: function() {
        // The lowest xlow and the highest xhigh define the extent in x.
        var xLowExtent = d3.extent(this.data, function(d) { return d.xlow; }),
            xHighExtent = d3.extent(this.data, function(d) { return d.xhigh; });
        return [xLowExtent[0], xHighExtent[1]];
      },
      yDomain: function() {
        // The lowest ylow and the highest yhigh define the extent in y.
        var yLowExtent = d3.extent(this.data, function(d) { return d.ylow; }),
            yHighExtent = d3.extent(this.data, function(d) { return d.yhigh; });
        return [yLowExtent[0], yHighExtent[1]];
      },
      zDomain: function() {
        var filtered = this.data.filter(function(d) { return d.z > 0; }),
            zExtent = d3.extent(filtered, function(d) { return d.z; });
        return [zExtent[0], (zExtent[1] - zExtent[0])/2.0, zExtent[1]];
      },
      draw: function(axes, g, transition) {
        if (arguments.length === 0) {
          console.log('Cannot draw ' + this.name + ', no arguments given');
          return;
        }
        if (transition === undefined) {
          transition = false;
        }
        g.classed('Histogram2D', true);
        var join = g.selectAll('rect').data(data),
            selection = transition === true ? join.transition().duration(250) : join;
        join.enter()
          .append('rect')
          .classed('tile', true);
        selection
          .attr('x', function(d) { return axes.xScale(d.xlow); })
          .attr('y', function(d) { return axes.yScale(d.yhigh); })
          .attr('width', function(d) { return axes.xScale(d.xhigh) - axes.xScale(d.xlow); })
          .attr('height', function(d) { return axes.yScale(d.ylow) - axes.yScale(d.yhigh); })
          .style('fill', function(d) { return d.z > 0 ? axes.zScale(d.z) : 'none'; });
      }
    };
  };

  d3.plotable = d3.plotable || {};
  d3.plotable.Histogram2D = Histogram2D;
})(window.d3);
