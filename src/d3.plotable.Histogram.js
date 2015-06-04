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
 * * `closed`: 'Close' the histogram line around the x-axis, such that the first and last bins
 *             have edges that meet the x-axis (default: false).
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
    if (config.showUncertainties === undefined) {
      config.showUncertainties = false;
    }
    if (config.closed === undefined) {
      config.closed = true;
    }
    // Add zero'd uncertainties if none are present
    for (var i = 0; i < data.length; i++) {
      var datum = data[i];
      if (!('yerr' in datum)) {
        datum.yerr = [0, 0];
      }
      data[i] = datum;
    }
    return {
      name: name,
      data: data,
      color: config.color,
      closed: config.closed,
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
            firstBinHeight = this.closed === true ? this.yDomain()[0] : data[0].y,
            zeroEl = [{xlow: firstBinEdge, xhigh: firstBinEdge, y: firstBinHeight, yerr: [0, 0]}],
            drawnData = zeroEl.concat(this.data);

        // If the histogram line should be closed, use svg.area to automatically
        // generate the bin edges in the lowest and highest bins, else use svg.line
        var linearea;
        if (this.closed === true) {
          linearea = d3.svg.area()
            .interpolate('step-before')
            .x(function(d) { return axes.xScale(d.xhigh); })
            .y(function(d) { return axes.yScale(d.y); })
            .y0(axes.yScale(this.yMinimum));
        } else {
          linearea = d3.svg.line()
            .interpolate('step-before')
            .x(function(d) { return axes.xScale(d.xhigh); })
            .y(function(d) { return axes.yScale(d.y); });
        }

        // Join the data with the lineshape
        var join = g.selectAll('path.line').data([drawnData]),
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
