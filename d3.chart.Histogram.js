(function(d3, undefined) {
  'use strict';
  d3.chart('BaseChart').extend('Histogram', {
    initialize: function() {
      var chart = this;
      chart.base.classed('Histogram');

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
      // Then the bars are drawn
      chart.layers.bars = innerG.append('g')
        .classed('bars', true);
      // Then the uncertainties
      // chart.layers.errors = innerG.append('g')
      //   .classed('errors', true);
      // Then the data points
      // chart.layers.points = innerG.append('g')
      //   .classed('points', true);
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

      // Layer for the bars
      chart.layer('bars', chart.layers.bars, {
        // Prepare data for binding, returning data join
        dataBind: function(data) {
          chart.data = data;

          return this.selectAll('rect').data(data);
        },
        // Append the expected elements and set their attributes
        insert: function() {
          return this.append('rect').classed('bar', true);
        },
        // Define lifecycle events
        // TODO extract transitions to HistogramAnimated? Toggable?
        events: {
          // Update bar attributes to reflect the data
          enter: function() {
            return this
              .attr('width', function(d) {
                return chart.xScale(d.dx) - chart.xScale(d.x);
              })
              .attr('height', function(d) {
                return 0;
              })
              .attr('x', function(d) {
                return chart.xScale(d.x);
              })
              .attr('transform', 'translate(0, ' + chart.height() + ')');
          },
          'enter:transition': function() {
            var chart = this.chart();
            this.duration(250)
              .attr('height', function(d) {
                return chart.height() - chart.yScale(d.y);
              })
              .attr('transform', function(d) {
                return 'translate(0, ' + chart.yScale(d.y) + ')';
              });
          },
          update: function() {
            // TODO assumes no y-scale change
            return this;
          },
          'update:transition': function() {
            return this
              .attr('width', function(d) {
                return chart.xScale(d.dx) - chart.xScale(d.x);
              })
              .attr('x', function(d) {
                return chart.xScale(d.x);
              });
          }
        }
      });

      /*
      chart.layer('points', chart.layers.points, {
        // Prepare data for binding, returning data join
        dataBind: function(data) {
          chart.data = data;

          return this.selectAll('circle').data(data);
        },
        // Append the expected elements and set their attributes
        insert: function() {
          return this.append('circle').classed('point', true);
        },
        // Define lifecycle events
        events: {
          // Update bar attributes to reflect the data
          enter: function() {
            return this
              .attr('r', 2)
              .attr('cx', function(d) {
                return (chart.xScale(d.x) + chart.xScale(d.dx))/2.;
              })
              .attr('cy', function(d) {
                return chart.yScale(d.y);
              });
          }
        }
      });

      chart.layer('errors', chart.layers.errors, {
        // Prepare data for binding, returning data join
        dataBind: function(data) {
          chart.data = data;

          return this.selectAll('line').data(data);
        },
        // Append the expected elements and set their attributes
        insert: function() {
          return this.append('line').classed('error', true);
        },
        // Define lifecycle events
        events: {
          // Update bar attributes to reflect the data
          enter: function() {
            return this
              .attr('x1', function(d) {
                return (chart.xScale(d.x) + chart.xScale(d.dx))/2.;
              })
              .attr('x2', function(d) {
                return (chart.xScale(d.x) + chart.xScale(d.dx))/2.;
              })
              .attr('y1', function(d) {
                return chart.yScale(d.y - d.xErr[0]);
              })
              .attr('y2', function(d) {
                return chart.yScale(d.y + d.xErr[1]);
              })
          }
        }
      });
      */
    },
    // Set up our scales to match the extent of the data
    transform: function(data) {
      // Assumes data sorted in ascending x-value
      var chart = this;
      var lowBin = data[0],
          highBin = data[data.length - 1];
      chart.xScale.domain([lowBin.x, highBin.dx]);
      var yExtent = d3.extent(data, function(d) { return d.y; });
      // Histogram y-axis should either start at zero or negative values
      var yLow = yExtent[0] > 0. ? 0. : yExtent[0];
      // 5% padding on the y-axis
      chart.yScale.domain([yExtent[0], 1.05*yExtent[1]]);
      chart.drawAxes();
      return data;
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
        var transition = chart.base.transition().duration(250);
        transition.select('.x.axis').call(chart.layers.xaxis);
        transition.select('.x.grid').call(chart.layers.xgrid);
        transition.select('.y.axis').call(chart.layers.yaxis);
        transition.select('.y.grid').call(chart.layers.ygrid);
      } else {
        chart.areas.xaxis.call(chart.layers.xaxis);
        chart.areas.xgrid.call(chart.layers.xgrid);
        chart.areas.yaxis.call(chart.layers.yaxis);
        chart.areas.ygrid.call(chart.layers.ygrid);
      }
    }
  });
})(window.d3);
