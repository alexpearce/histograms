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
 * * `yerr`: Uncertainty on `y` as a 2-tuple (low, high)
 *
 * Configuration
 * -------------
 * The possible configuration keys are:
 *
 * * `color`: The color of the histogram line as a CSS-compatiable string
 *            (default: '#261196').
 * * `yMinimum`: The minimum value shown on the y-axis (default: 0).
 *               If the extent of the bin values is lower than yMinimum,
 *               yMinimum will be overrided.
 * * `showUncertainties`: Show the uncertainties on each bin as error bars (default: false).
 *                        This requires the `yerr` key on each data object.
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
    if (config.yMinimum === undefined) {
      config.yMinimum = 0;
    }
    return {
      name: name,
      data: data,
      color: config.color,
      yMinimum: config.yMinimum,
      showUncertainties: config.showUncertainties,
      xDomain: function() {
        // The lowest xlow and the highest xhigh define the extent in x.
        // Add a 5% padding around the extent for aesthetics.
        var xExtent = d3.extent(this.data, function(d) { return d.xlow; }),
            dxExtent = d3.extent(this.data, function(d) { return d.xhigh; }),
            xPadding = 0.05*Math.abs(xExtent[0] - dxExtent[1]);
        return [xExtent[0] - xPadding, dxExtent[1] + xPadding];
      },
      yDomain: function() {
        // Add a 5% padding at the top of the y extent
        var yExtent = d3.extent(this.data, function(d) { return (d.y + d.yerr[1]); }),
            minimum = Math.min(this.yMinimum, yExtent[0]);
        return [minimum, 1.05*yExtent[1]];
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
        // Prepend a datum to the data for drawing, defining the beginning of
        // the line area
        // If this datum is not added, the lower edge of the first bin is hidden
        var firstBinEdge = data[0].xlow,
            zeroEl = [{xlow: firstBinEdge, xhigh: firstBinEdge, y: this.yDomain()[0], yerr: [0, 0]}],
            drawnData = zeroEl.concat(this.data);
        // The histogram line
        var linearea = d3.svg.area()
              .interpolate('step-before')
              .x(function(d) { return axes.xScale(d.xhigh); })
              .y1(function(d) { return axes.yScale(d.y); })
              .y0(axes.yScale(this.yMinimum)),
            join = g.selectAll('path.line').data([drawnData]),
            selection = transition === true ? join.transition().duration(250) : join;
        join.enter()
          .append('path')
          .classed('line', true)
          .attr('fill', 'none')
          .attr('stroke', this.color);
        selection.attr('d', linearea);
        // Uncertainties
        var uJoin = g.selectAll('path.uncertainty').data(this.data),
            uSelection = transition === true ? uJoin.transition().duration(250) : uJoin;
        uJoin.enter()
          .append('path')
          .classed('uncertainty', true)
          .attr('fill', 'none')
          .attr('stroke', this.color);
        if (this.showUncertainties === true) {
          uSelection
            .attr('d', function(d) {
              var xCenter = axes.xScale(d.xhigh - (d.xhigh - d.xlow)/2.0),
                  tickWidth = (axes.xScale(d.xhigh) - axes.xScale(d.xlow))/10.0,
                  xLow = xCenter - tickWidth,
                  xHigh = xCenter + tickWidth,
                  yLow = axes.yScale(d.y - d.yerr[0]),
                  yHigh = axes.yScale(d.y + d.yerr[1]);
              return 'M' + xLow + ' ' + yLow +
                'H' + xHigh +
                'M' + xLow + ' ' + yHigh +
                'H' + xHigh +
                'M' + xCenter + ' ' + yHigh +
                'V' + yLow;
            });
        }
      }
    };
  };

  d3.plotable = d3.plotable || {};
  d3.plotable.Histogram = Histogram;
})(window.d3);
