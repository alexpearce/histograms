(function(d3, undefined) {
  'use strict';
  d3.chart('BaseChart').extend('AxesChart', {
    initialize: function() {
      var chart = this;
      chart.base.classed('AxesChart');

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
      chart.areas.yaxis = innerG.append('g')
        .classed('y axis', true);

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
      chart.layers.xaxis = d3.svg.axis()
        .ticks(5)
        .scale(chart.xScale)
        .orient('bottom');
      chart.layers.xgrid = d3.svg.axis()
        .ticks(5)
        .scale(chart.xScale)
        .orient('bottom')
        .tickSize(-chart.height(), 0, 0).tickFormat('');
      chart.layers.yaxis = d3.svg.axis()
        .ticks(5)
        .scale(chart.yScale)
        .orient('left');
      chart.layers.ygrid = d3.svg.axis()
        .ticks(5)
        .scale(chart.yScale)
        .orient('left')
        .tickSize(-chart.width(), 0, 0).tickFormat('');

      // Update width/height dependent elements on change
      chart.on('change:width', function() {
        chart.xScale.range([0, chart.width()]);
        chart.areas.xlabel.attr('transform', 'translate(' + (chart.width() + chart.margins.left) + ',' + (chart.height() + chart.margins.top + chart.margins.bottom) + ')');
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

      // Reset the tick formatter to the default
      // By doing this, our manipulation later doesn't screw things up,
      // as the default ticks are put back in place before we touch them
      chart.layers.xaxis.tickFormat(null);

      if (transition === true) {
        var t = chart.base.transition().duration(250);
        t.select('.x.axis').call(chart.layers.xaxis);
        t.select('.x.grid').call(chart.layers.xgrid);
        t.select('.y.axis').call(chart.layers.yaxis);
        t.select('.y.grid').call(chart.layers.ygrid);
      } else {
        chart.areas.xaxis.call(chart.layers.xaxis);
        chart.areas.xgrid.call(chart.layers.xgrid);
        chart.areas.yaxis.call(chart.layers.yaxis);
        chart.areas.ygrid.call(chart.layers.ygrid);
      }

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
      var siTickFormatter = function(ticks) {
        var exponentDiff = exponent(ticks[0] - ticks[1]);
        // Only negative exponents need decimal places
        exponentDiff = exponentDiff < 0 ? Math.abs(exponentDiff) : 0;
        // Format the new tick values to the calculated fixed precision
        return function(value, tickNumber) {
          return ticks[tickNumber].toFixed(exponentDiff);
        };
      };

      // Transform the tick values automatically created by D3 in to scientific notation,
      // with the exponent rounded to the nearest multiple of three
      var xTicks = chart.xScale.ticks(chart.layers.xaxis.ticks()[0]),
          yTicks = chart.yScale.ticks(chart.layers.yaxis.ticks()[0]);
      chart._xExponent = ticksExponent(xTicks);
      chart._yExponent = ticksExponent(yTicks);
      var xNewTicks = xTicks.map(function(d) { return d/Math.pow(10, chart._xExponent); }),
          yNewTicks = yTicks.map(function(d) { return d/Math.pow(10, chart._yExponent); });
      chart.layers.xaxis.tickFormat(siTickFormatter(xNewTicks));
      chart.layers.yaxis.tickFormat(siTickFormatter(yNewTicks));
      // Update the axes and labels to reflect the new exponent
      // TODO making these calls cancels the any ongoing axis transition
      chart.areas.xaxis.call(chart.layers.xaxis);
      chart.xAxisLabel(chart.xAxisLabel());
      chart.areas.yaxis.call(chart.layers.yaxis);
      chart.yAxisLabel(chart.yAxisLabel());
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
