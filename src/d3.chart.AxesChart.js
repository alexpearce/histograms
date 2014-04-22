(function(d3, undefined) {
  'use strict';
  d3.chart('BaseChart').extend('AxesChart', {
    initialize: function() {
      var chart = this;
      chart.base.classed('AxesChart');

      // Define blank x- and y-axis labels
      chart._xAxisLabel = '';
      chart._yAxisLabel = '';

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
    drawAxes: function(transition) {
      var chart = this;

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
    },
    xAxisLabel: function(newLabel) {
      if (arguments.length === 0) {
        return this._xAxisLabel;
      }
      this._xAxisLabel = newLabel;
      this.areas.xlabel.select('text').text(this.xAxisLabel());
      return this;
    },
    yAxisLabel: function(newLabel) {
      if (arguments.length === 0) {
        return this._yAxisLabel;
      }
      this._yAxisLabel = newLabel;
      this.areas.ylabel.select('text').text(this.yAxisLabel());
      return this;
    }
  });
})(window.d3);
