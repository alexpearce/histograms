(function(d3, undefined) {
  'use strict';
  d3.chart('BaseChart').extend('AxesChart', {
    initialize: function() {
      var chart = this;
      chart.base.classed('AxesChart', true);

      // Define blank x- and y-axis labels
      chart._xAxisLabel = '';
      chart._yAxisLabel = '';
      // Define zero x- and y-scale exponent
      chart._xExponent = 0;
      chart._yExponent = 0;

      // Transform scale; from data coordinates to canvas coordinates
      chart.xScale = d3.scale.linear().range([0, chart.width()]);
      chart.yScale = d3.scale.linear().range([chart.height(), 0]);

      // Get inner 'canvas'
      var innerG = chart.base.select('g');

      // Create an axis with a given scale, number of ticks, and orientation
      // The ticks are positioned 'inside' the plot, e.g. an axis with
      // orientation 'bottom' will have ticks pointing up
      var createAxis = function(scale, ticks, orientation) {
        var axis = d3.svg.axis();
        return axis.ticks(ticks)
          .scale(scale)
          .orient(orientation)
          .innerTickSize(-axis.innerTickSize())
          .outerTickSize(-axis.outerTickSize())
          .tickPadding(axis.tickPadding() + 4);
      };

      // We define groups by z-order
      // Grid lines are drawn under everything
      chart.areas.xgrid = innerG.append('g')
        .classed('x grid', true)
        .attr('transform', 'translate(0,' + chart.height() + ')');
      chart.areas.ygrid = innerG.append('g')
        .classed('y grid', true);
      // And finally the axes
      chart.areas.xaxis = innerG.append('g')
        .classed('x axis', true)
        .attr('transform', 'translate(0,' + chart.height() + ')');
      chart.areas.xaxistop = innerG.append('g')
        .classed('x axis', true);
      chart.areas.yaxis = innerG.append('g')
        .classed('y axis', true);
      chart.areas.yaxisright = innerG.append('g')
        .classed('y axis', true)
        .attr('transform', 'translate(' + chart.width() + ', 0)');

      // Axes labels (always label your axes, kids!)
      chart.areas.xlabel = chart.base.append('g')
        .classed('x axis-label', true)
        .attr('transform', 'translate(' + (chart.width() + chart.margins.left) + ',' + (chart.height() + chart.margins.top + chart.margins.bottom) + ')');
      chart.areas.xlabel.append('text')
        .attr('text-anchor', 'end')
        .attr('dy', '-0.2em');
      chart.areas.ylabel = chart.base.append('g')
        .classed('y axis-label', true)
        .attr('transform', 'rotate(-90) translate(' + -chart.margins.top + ')');
      chart.areas.ylabel.append('text')
        .attr('text-anchor', 'end')
        .attr('dy', '1em');

      // Create axis and grid layers
      // TODO configurable tick numbers?
      var xTicks = 5,
          yTicks = 5;
      chart.layers.xaxis = createAxis(chart.xScale, xTicks, 'bottom');
      chart.layers.xaxistop = createAxis(chart.xScale, xTicks, 'top')
        .tickFormat('');
      chart.layers.xgrid = createAxis(chart.xScale, xTicks, 'bottom')
        .tickSize(-chart.height(), 0, 0)
        .tickFormat('');
      chart.layers.yaxis = createAxis(chart.yScale, yTicks, 'left');
      chart.layers.yaxisright = createAxis(chart.yScale, yTicks, 'right')
        .tickFormat('');
      chart.layers.ygrid = createAxis(chart.yScale, yTicks, 'left')
        .tickSize(-chart.width(), 0, 0)
        .tickFormat('');

      // Return the base-10 exponent of the absolute value of x
      // If you write x in scientific notation, this will return the exponent
      var exponent = function(x) {
        return Math.floor(Math.log(Math.abs(x))/Math.LN10);
      };

      // Return the multiple-of-three exponent for the array of tick values
      // The exponent returned is the maximum exponent within the ticks,
      // rounded down to the nearest multiple of three
      // This is more familiar, matching SI prefixes (kilo 10^3, mega 10^6, etc.)
      var ticksExponent = function(ticks) {
        // Calculate the [minimum, maximum] tick values,
        // then the base-10 exponent for these min/max values
        // Use the biggest exponent as the one we show
        var oldTicks = ticks,
            extent = d3.extent(oldTicks),
            minExponent = exponent(extent[0]),
            maxExponent = exponent(extent[1]),
            exp = d3.max([maxExponent, minExponent]);
        return 3*Math.floor(exp/3);
      };

      // Return a function which accepts a value and tick number,
      // itself returning an appropriately rounded value
      // A nice precision is one fine enough such that adjacent ticks aren't rounded to be equal
      // For example, two adajacent ticks with values (0.998, 0.999) require
      // three digits of precision, whereas (12.5, 23.5) requires zero
      // This method assumes all ticks are spaced equally apart
      var siTickFormatter = function(scale, axis, callback) {
        // By placing this logic inside the returned function, the values
        // are updated on each call
        // Placing them outside would result in stale `ticks` and `exp` values
        return function(value, tickNumber) {
          var ticks = scale.ticks(axis.ticks()[0]),
              exp = ticksExponent(ticks),
              newTicks = ticks.map(function(d) { return d/Math.pow(10, exp); } );
          var expDiff = exponent(newTicks[0] - newTicks[1]);
          expDiff = expDiff < 0 ? Math.abs(expDiff) : 0;
          if (typeof callback === 'function') {
            callback(exp);
          }
          return (value/Math.pow(10, exp)).toFixed(expDiff);
        };
      };

      // Create formatters for the x- and y-axis
      // The callback updates the axis label when the ticks are updated
      var xFormatter = siTickFormatter(chart.xScale, chart.layers.xaxis, function(exp) {
        chart._xExponent = exp;
        chart.xAxisLabel(chart.xAxisLabel());
      });
      var yFormatter = siTickFormatter(chart.yScale, chart.layers.yaxis, function(exp) {
        chart._yExponent = exp;
        chart.yAxisLabel(chart.yAxisLabel());
      });
      chart.layers.xaxis.tickFormat(xFormatter);
      chart.layers.yaxis.tickFormat(yFormatter);

      // Update width/height dependent elements on change
      chart.on('change:width', function() {
        chart.xScale.range([0, chart.width()]);
        chart.areas.xlabel.attr('transform', 'translate(' + (chart.width() + chart.margins.left) + ',' + (chart.height() + chart.margins.top + chart.margins.bottom) + ')');
        chart.areas.yaxisright.attr('transform', 'translate(' + chart.width() + ', 0)');
        chart.layers.ygrid.tickSize(-chart.width(), 0, 0);
      });
      chart.on('change:height', function() {
        chart.yScale.range([chart.height(), 0]);
        chart.areas.xaxis.attr('transform', 'translate(0,' + chart.height() + ')');
        chart.areas.xgrid.attr('transform', 'translate(0,' + chart.height() + ')');
        chart.areas.xlabel.attr('transform', 'translate(' + (chart.width() + chart.margins.left) + ',' + (chart.height() + chart.margins.top + chart.margins.bottom) + ')');
        chart.layers.xgrid.tickSize(-chart.height(), 0, 0);
      });
    },
    // All charts deriving from this one should call drawAxes whenever there
    // is a scale change, i.e. if chart.xScale or chart.yScale is updated
    drawAxes: function(transition) {
      var chart = this;

      var dur = transition === true ? 250 : 0;
      chart.areas.xaxis.transition().duration(dur)
        .call(chart.layers.xaxis);
      chart.areas.xaxistop.transition().duration(dur)
        .call(chart.layers.xaxistop);
      chart.areas.xgrid.transition().duration(dur)
        .call(chart.layers.xgrid);
      chart.areas.yaxis.transition().duration(dur)
        .call(chart.layers.yaxis);
      chart.areas.yaxisright.transition().duration(dur)
        .call(chart.layers.yaxisright);
      chart.areas.ygrid.transition().duration(dur)
        .call(chart.layers.ygrid);
    },
    xAxisLabel: function(newLabel) {
      if (arguments.length === 0) {
        return this._xAxisLabel;
      }
      this._xAxisLabel = newLabel;
      // Append the value of the exponent, if there is one
      if (this._xExponent !== 0) {
        this.areas.xlabel.select('text')
          .text(this.xAxisLabel() + ' ×1e' + this._xExponent);
      } else {
        this.areas.xlabel.select('text')
          .text(this.xAxisLabel());
      }
      return this;
    },
    yAxisLabel: function(newLabel) {
      if (arguments.length === 0) {
        return this._yAxisLabel;
      }
      this._yAxisLabel = newLabel;
      // Append the value of the exponent, if there is one
      if (this._yExponent !== 0) {
        this.areas.ylabel.select('text')
          .text(this.yAxisLabel() + ' ×1e' + this._yExponent);
      } else {
        this.areas.ylabel.select('text')
          .text(this.yAxisLabel());
      }
      return this;
    }
  });
})(window.d3);
