(function(d3, undefined) {
  'use strict';
  d3.chart('BaseChart').extend('AxesChart', {
    initialize: function() {
      var chart = this;
      chart.base.classed('AxesChart');

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

      // Update width/height dependent elements on change
      chart.on('change:width', function() {
        chart.xScale.range([0, chart.width()]);
      });
      chart.on('change:height', function() {
        chart.yScale.range([chart.height(), 0]);
        chart.areas.xaxis.attr('transform', 'translate(0,' + chart.height() + ')');
        chart.areas.xgrid.attr('transform', 'translate(0,' + chart.height() + ')');
      });
    },
    drawAxes: function(transition) {
      if (transition === undefined) {
        transition = false;
      }
      var chart = this;
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
    }
  });
})(window.d3);
