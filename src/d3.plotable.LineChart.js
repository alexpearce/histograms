/*
 * d3.plotable.LineChart
 *
 * d3.plotable which draws a line chart.
 *
 * Data API
 * --------
 * The data object is an array of objects, each of which must contain the
 * followings keys:
 *
 * * `x`: Abscissa value
 * * `y`: Ordinate value
 *
 * The other optional keys per object are:
 *
 * * `xerr`: Uncertainty on `x` as a 2-tuple (low, high)
 * * `yerr`: Uncertainty on `y` as a 2-tuple (low, high)
 *
 * Configuration
 * -------------
 * The possible configuration keys are:
 *
 * * `color`: The color of the line as a CSS-compatiable string
 *            (default: '#261196').
 * * `interpolation`: The interpolation method applied to the line (default: 'basis')
 *                    For all available options, see:
 *                      https://github.com/mbostock/d3/wiki/SVG-Shapes#line_interpolate
 * * `showPoints`: Show points associated with each coordinate (default: False).
 * * `showUncertainties`: Show the uncertainties on each bin as error bars (default: false).
 *                        This requires the `yerr` key on each data object.
 */
(function(d3, undefined) {
  'use strict';
  var LineChart = function(name, data, config) {
    if (config === undefined) {
      config = {};
    }
    // Check the configuration for allowed keys
    if (config.color === undefined) {
      config.color = '#261196';
    }
    if (config.interpolation === undefined) {
      config.interpolation = 'basis';
    }
    if (config.showPoints === undefined) {
      config.showPoints = false;
    }
    if (config.showUncertainties === undefined) {
      config.showUncertainties = false;
    }
    // Add zero'd uncertainties if none are present
    for (var i = 0; i < data.length; i++) {
      var datum = data[i];
      if (!('xerr' in datum)) {
        datum.xerr = [0, 0];
      }
      if (!('yerr' in datum)) {
        datum.yerr = [0, 0];
      }
      data[i] = datum;
    }
    return {
      name: name,
      data: data,
      color: config.color,
      interpolation: config.interpolation,
      showPoints: config.showPoints,
      showUncertainties: config.showUncertainties,
      xDomain: function() {
        // The lowest x value minus the its lower error and the highest x value plus
        // its higher error define the extent in x.
        // Add a 5% padding around the extent for aesthetics.
        var xHighExtent = d3.extent(this.data, function(d) { return (d.x + d.xerr[1]); }),
            xLowExtent = d3.extent(this.data, function(d) { return (d.x - d.xerr[0]); }),
            xExtent = [xLowExtent[0], xHighExtent[1]],
            xPadding = 0.05*Math.abs(xExtent[0] - xExtent[1]);
        return [xExtent[0] - xPadding, xExtent[1] + xPadding];
      },
      yDomain: function() {
        // The lowest y value minus its lower error and the highest y value plus
        // its higher error define the extent in y.
        // Add a 5% padding around the extent for aesthetics.
        var yHighExtent = d3.extent(this.data, function(d) { return (d.y + d.yerr[1]); }),
            yLowExtent = d3.extent(this.data, function(d) { return (d.y - d.yerr[0]); }),
            yExtent = [yLowExtent[0], yHighExtent[1]],
            yPadding = 0.05*Math.abs(yExtent[0] - yExtent[1]);
        return [yExtent[0] - yPadding, yExtent[1] + yPadding];
      },
      draw: function(axes, g, transition) {
        if (arguments.length === 0) {
          console.error('Cannot draw ' + this.name + ', no arguments given');
          return;
        }
        if (transition === undefined) {
          transition = false;
        }
        g.classed('LineChart', true);
        var line = d3.svg.line()
              .interpolate(this.interpolation)
              .x(function(d) { return axes.xScale(d.x); })
              .y(function(d) { return axes.yScale(d.y); }),
            join = g.selectAll('path.line').data([this.data]),
            selection = transition === true ? join.transition().duration(250) : join;
        join.enter()
          .append('path')
          .classed('line', true)
          .attr('fill', 'none')
          .attr('stroke', this.color);
        selection.attr('d', line);

        // Points
        var pointsJoin = g.selectAll('circle.point').data(this.data),
            pointsSelection = transition === true ? pointsJoin.transition().duration(250) : pointsJoin;
        pointsJoin.enter()
          .append('circle')
          .classed('point', true)
          .attr('fill', this.color);
        if (this.showPoints === true) {
          pointsSelection
            .attr('cx', function(d) { return axes.xScale(d.x); })
            .attr('cy', function(d) { return axes.yScale(d.y); })
            .attr('r', 2);
        }

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
              var x = axes.xScale(d.x),
                  xLow = axes.xScale(d.x - d.xerr[0]),
                  xHigh = axes.xScale(d.x + d.xerr[1]),
                  y = axes.yScale(d.y),
                  yLow = axes.yScale(d.y - d.yerr[0]),
                  yHigh = axes.yScale(d.y + d.yerr[1]),
                  tickWidth = 4;
              var yPath = 'M' + (x - tickWidth) + ' ' + yLow +
                'H' + (x + tickWidth) +
                'M' + x + ' ' + yLow +
                'V' + yHigh +
                'M' + (x - tickWidth) + ' ' + yHigh +
                'H' + (x + tickWidth);
              var xPath = 'M' + xLow + ' ' + (y - tickWidth) +
                'V' + (y + tickWidth) +
                'M' + xLow + ' ' + y +
                'H' + xHigh +
                'M' + xHigh + ' ' + (y + tickWidth) +
                'V' + (y - tickWidth);
              return yPath + xPath;
            });
        }
      }
    };
  };

  d3.plotable = d3.plotable || {};
  d3.plotable.LineChart = LineChart;
})(window.d3);
