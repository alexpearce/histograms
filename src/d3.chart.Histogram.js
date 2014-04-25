(function(d3, undefined) {
  'use strict';
  d3.chart('AxesChart').extend('Histogram', {
    initialize: function() {
      var chart = this;
      chart.base.classed('Histogram');

      // Get inner 'canvas'
      var innerG = chart.base.select('g');

      // Draw the line
      chart.layers.line = innerG.append('g')
        .classed('line', true);
      // Then the uncertainties
      // chart.layers.errors = innerG.append('g')
      //   .classed('errors', true);
      // Then the data points
      // chart.layers.points = innerG.append('g')
      //   .classed('points', true);

      chart.layer('line', chart.layers.line, {
        dataBind: function(data) {
          return this.selectAll('path').data([data]);
        },
        insert: function() {
          return this.append('path')
            .classed('line', true)
            .attr('fill', 'none')
            .attr('stroke', 'rgb(38, 17, 150)');
        },
        events: {
          enter: function() {
            var yMax = d3.max(chart.yScale.range());
            var line = d3.svg.area()
              .interpolate('step-before')
              .x(function(d) { return chart.xScale(d.dx); })
              .y1(function(d) { return chart.yScale(d.y); })
              .y0(function(d) { return yMax; });
            return this.attr('d', line);
          },
          update: function() {
            // TODO assumes no y-scale change
            return this;
          },
          'update:transition': function() {
            var yMax = d3.max(chart.yScale.range());
            var line = d3.svg.area()
              .interpolate('step-before')
              .x(function(d) { return chart.xScale(d.dx); })
              .y1(function(d) { return chart.yScale(d.y); })
              .y0(function(d) { return yMax; });
            return this.attr('d', line);
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
      var chart = this;
      // Cache data so we can use it to redraw later
      chart.data = data;
      // Get the upper and lower limits for x, dx, and y in the data
      var xExtent = d3.extent(data.map(function(d) { return d.x; })),
          dxExtent = d3.extent(data.map(function(d) { return d.dx; })),
          yExtent = d3.extent(data, function(d) { return d.y; });
      // The domain is from the lower bound of the lowest bin to the higher
      // bound of the highest bin
      chart.xScale.domain([xExtent[0], dxExtent[1]]);
      // Histogram y-axis should either start at zero or negative values
      var yLow = yExtent[0] > 0.0 ? 0.0 : yExtent[0];
      // 5% padding on the y-axis
      chart.yScale.domain([yLow, 1.05*yExtent[1]]);
      // (Re)draw the axes as we've changed the scale
      chart.drawAxes();
      return data;
    }
  });
})(window.d3);
