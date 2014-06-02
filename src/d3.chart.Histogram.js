(function(d3, undefined) {
  'use strict';
  d3.chart('AxesChart').extend('Histogram', {
    initialize: function() {
      var chart = this;
      chart.base.classed('Histogram', true);

      // Get inner 'canvas'
      var innerG = chart.base.select('g');

      // Draw the line underneath the axes, but above the grid
      chart.layers.line = innerG.insert('g', '.axis')
        .classed('line', true);
      // Then the uncertainties
      // chart.layers.errors = innerG.append('g')
      //   .classed('errors', true);
      // Then the data points
      // chart.layers.points = innerG.append('g')
      //   .classed('points', true);

      // Create line area shape for use in the layer
      var linearea = d3.svg.area()
        .interpolate('step-before')
        .x(function(d) { return chart.xScale(d.dx); })
        .y1(function(d) { return chart.yScale(d.y); })
        .y0(function(d) { return d3.max(chart.yScale.range()); });

      chart.layer('line', chart.layers.line, {
        dataBind: function(data) {
          // TODO It's a little ugly having this map here, it should really be in transform,
          // but I can't think of a nice way to preserve the other attributes and keep the
          // nicity of being able to do `chart.layers.line.draw(chart.data)`
          var values = data.map(function(d) { return d.values; });
          return this.selectAll('path').data(values);
        },
        insert: function() {
          // Fetch colours from data, else using blue as default
          var colours = chart.data.map(function(d) { return d.colour || 'rgb(38, 17, 150)'; });
          return this.append('path')
            .classed('line', true)
            .attr('fill', 'none')
            .attr('stroke', function(d, i) { return colours[i]; });
        },
        events: {
          enter: function() {
            return this.attr('d', linearea);
          },
          update: function() {
            // TODO assumes no y-scale change
            return this;
          },
          'update:transition': function() {
            return this.attr('d', linearea);
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
      var xExtent = [],
          dxExtent = [],
          xPadding = [],
          yExtent = [];
      // Define functions outside loop to avoid redeclaration
      var getX = function(d) { return d.x; },
          getDx = function(d) { return d.dx; },
          getY = function(d) { return d.y; };
      for (var num = 0; num < data.length; num++) {
        var series = data[num].values;
        // Get the upper and lower limits for x, dx, and y in the data
        xExtent = d3.extent(series.map(getX).concat(xExtent));
        dxExtent = d3.extent(series.map(getDx).concat(dxExtent));
        xPadding = 0.05*Math.abs(xExtent[0] - dxExtent[1]);
        yExtent = d3.extent(series.map(getY).concat(yExtent));
      }
      // The domain is from the lower bound of the lowest bin to the higher
      // bound of the highest bin, with 5% padding either side
      chart.xScale.domain([xExtent[0] - xPadding, dxExtent[1] + xPadding]);
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
