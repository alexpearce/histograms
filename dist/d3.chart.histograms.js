/*
 * BaseChart defines a chart others can extend.
 *   d3.chart('BaseChart').extend('MyChart', { ... });
 * It provides width and height setters and getters, and innerWidth and
 * innerHeight getters.
 * The width and height properties are those of the SVG 'pad', whilst the
 * innerWidth and innerHeight properties are the width and height of the
 * 'plot' itself.
 */
(function(d3, undefined) {
  'use strict';
  d3.chart('BaseChart', {
    initialize: function() {
      var chart = this;

      chart.margins = {
        top: 10,
        bottom: 40,
        left: 50,
        right: 10,
        padding: 10
      };

      // Defaults
      // Chart width
      chart._width = chart.base.attr('width') ?
        chart.base.attr('width') - (chart.margins.right + chart.margins.left)
        : 200;
      // Chart height
      chart._height = chart.base.attr('height') ?
        chart.base.attr('height') - (chart.margins.top + chart.margins.bottom)
        : 200;

      // Make sure the container is set
      chart.updateContainerWidth();
      chart.updateContainerHeight();

      // Add inner container offset by margins
      chart.base.append('g')
        .attr('transform', 'translate(' + this.margins.left + ',' + this.margins.top + ')');

      // Containers for areas and layers
      chart.areas = {};
      chart.layers = {};
    },
    // Chart width setter/getter
    width: function(newWidth) {
      if (arguments.length === 0) {
        return this._width;
      }
      var oldWidth = this._width;
      this._width = newWidth;
      this.updateContainerWidth();
      this.trigger('change:width', newWidth, oldWidth);
      return this;
    },
    // Chart height setter/getter
    height: function(newHeight) {
      if (arguments.length === 0) {
        return this._height;
      }
      var oldHeight = this._height;
      this._height = newHeight;
      this.updateContainerHeight();
      this.trigger('change:height', newHeight, oldHeight);
      return this;
    },
    updateContainerWidth: function() {
      this.base
        .attr('width', this._width + this.margins.left + this.margins.right);
    },
    updateContainerHeight: function() {
      this.base
        .attr('height', this._height + this.margins.top + this.margins.bottom);
    }
  });
})(window.d3);
;(function(d3, undefined) {
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
;(function(d3, undefined) {
  'use strict';
  d3.chart('AxesChart').extend('Histogram', {
    initialize: function() {
      var chart = this;
      chart.base.classed('Histogram');

      // Get inner 'canvas'
      var innerG = chart.base.select('g');

      // Then the bars are drawn
      chart.layers.bars = innerG.append('g')
        .classed('bars', true);
      // Then the uncertainties
      // chart.layers.errors = innerG.append('g')
      //   .classed('errors', true);
      // Then the data points
      // chart.layers.points = innerG.append('g')
      //   .classed('points', true);

      // Layer for the bars
      chart.layer('bars', chart.layers.bars, {
        // Prepare data for binding, returning data join
        dataBind: function(data) {
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
    // Assumes data sorted in ascending x-value
    transform: function(data) {
      var chart = this;
      // Cache data so we can use it to redraw later
      chart.data = data;
      var lowBin = data[0],
          highBin = data[data.length - 1];
      chart.xScale.domain([lowBin.x, highBin.dx]);
      var yExtent = d3.extent(data, function(d) { return d.y; });
      // Histogram y-axis should either start at zero or negative values
      var yLow = yExtent[0] > 0.0 ? 0.0 : yExtent[0];
      // 5% padding on the y-axis
      chart.yScale.domain([yExtent[0], 1.05*yExtent[1]]);
      chart.drawAxes();
      return data;
    }
  });
})(window.d3);
;(function(d3, undefined) {
  'use strict';
  d3.chart('Histogram').extend('HistogramZoom', {
    initialize: function() {
      var chart = this;

      // Add a clipping path to hide histogram outside chart area
      var clipRect = chart.base.append('defs').append('clipPath')
        .attr('id', 'chartArea')
        .append('rect')
        .attr('width', chart.width())
        .attr('height', chart.height());

      // Applying the clipping path to the chart area
      chart.layers.bars.attr('clip-path', 'url(#chartArea)');

      var updateScaleDomain = function(newDomain) {
        chart.xScale.domain(newDomain);
        chart.drawAxes(true);
        chart.layers.bars.draw(chart.data);
      };

      // Brushes for zooming
      var brush = d3.svg.brush()
        .x(chart.xScale)
        .on('brush', function() {
          // Apply a 'selected' class to bars within the brush's extent
          var extent = brush.extent();
          chart.layers.bars.selectAll('rect').classed('selected', function(d) {
            var lowerInExtent = extent[0] <= d.x && d.x <= extent[1];
            var upperInExtent = extent[0] <= d.dx && d.dx <= extent[1];
            return (lowerInExtent || upperInExtent);
          });
        })
        .on('brushend', function() {
          // On ending a brush stroke:
          // 0. Do nothing if the selection's empty
          if (brush.empty() === true) {
            return;
          }
          // 1. Add a 'clear zoom' button if it doesn't exist
          var clearButton = chart.base.select('.clear-button');
          if (clearButton.empty() === true) {
            // Cache the original domain so we restore to later
            chart.xScale.originalDomain = chart.xScale.domain();
            // Create a group to hold rectangle and text
            var clearG = chart.base.append('g')
              .classed('clear-button', true)
              .attr('transform', 'translate(' +
                  (chart.width() - chart.margins.left) + ',' +
                  chart.margins.top + ')'
              );
            // Add the rounded rectangle to act as a background
            clearG.append('rect')
              .attr('width', 100)
              .attr('height', 40)
              .attr('rx', 2)
              .attr('ry', 2);
            // Add the text
            clearG.append('text')
              .attr('x', 10)
              .attr('y', 25)
              .text('Clear zoom');
            // When the group is clicked, undo the zoom and remove the button
            clearG.on('click', function() {
                chart.base.select('.brush').call(brush.clear());
                // Restore to the origin, cached domain
                updateScaleDomain(chart.xScale.originalDomain);
                clearG.remove();
              });
          }
          // 2. Update the x-axis domain
          updateScaleDomain(brush.extent());
          // 3. Remove the selected class on all bars
          chart.layers.bars.selectAll('rect').classed('selected', false);
          // 4. Clear the brush's extent
          chart.base.select('.brush').call(brush.clear());
        });

      // Add the brush to the canvas
      chart.areas.brush = chart.base.append('g')
        .classed('brush', true)
        .attr('transform', 'translate(' + chart.margins.left + ', ' + chart.margins.top + ')');
      chart.areas.brush.call(brush)
        .selectAll('rect')
        .attr('height', chart.height());

      // Update width/height dependent elements on change
      chart.on('change:height', function() {
        clipRect.attr('height', chart.height());
        chart.areas.brush
          .call(brush)
          .selectAll('rect')
          .attr('height', chart.height());
      });
      chart.on('change:width', function() {
        clipRect.attr('width', chart.width());
      });
    }
  });
})(window.d3);
