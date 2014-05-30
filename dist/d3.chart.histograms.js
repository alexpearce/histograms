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
        left: 60,
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
;(function(d3, undefined) {
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

      // Create line area shape for use in the layer
      var linearea = d3.svg.area()
        .interpolate('step-before')
        .x(function(d) { return chart.xScale(d.dx); })
        .y1(function(d) { return chart.yScale(d.y); })
        .y0(function(d) { return d3.max(chart.yScale.range()); });

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
          xPadding = 0.05*Math.abs(xExtent[0] - dxExtent[1]),
          yExtent = d3.extent(data, function(d) { return d.y; });
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
;(function(d3, undefined) {
    'use strict';
    d3.chart('AxesChart').extend('2DHistogram', {
	initialize: function() {
	    var chart = this;
	    chart.base.classed('2DHistogram');
	    

	    //Transfom scale for the z-axis
	    chart.zScale = d3.scale.linear()
		.range(["#2c7bb6", "#ffffbf", "#d7191c"])
		.interpolate(d3.interpolateHcl);
	    // Get inner 'canvas'
	    var innerG = chart.base.select('g');

	    //gain space on the right in order to insert the zscale 
	    chart.margins.right = 100;

	    //legend for Z axis
	    chart.areas.legend = chart.base.append('g')
		.classed("legend",true);

	    // add the tiles to layers
	    chart.layers.tiles = innerG.append('g')
		.classed('tiles', true);

	    chart.layer('rect', chart.layers.tiles, {
		dataBind: function(data) {
		    return this.selectAll('rect').data(data.data);
		},
		insert: function() {
		    return this.append('rect')
			.classed('tiles', true);
		},
		events: {
		    enter: function() {
			return this
			    .attr("x",function(d) { return chart.xScale(d.xlow); })
			    .attr("y",function(d) { return chart.yScale(d.yup); })
			    .attr("width",function(d) { return chart.xScale(d.xup-d.xlow)-chart.xScale(0); })
			    .attr("height",function(d){ return chart.yScale(0)-chart.yScale(d.yup-d.ylow); })
			    .style("fill", function(d) {return chart.zScale(d.val); });

		    },
		    update: function() {
			// TODO assumes no y-scale change
			return this;
		    }
		}
	    });
	},
	transform: function(data) {
	    var chart = this;
	    //cache data 
	    chart.data = data.data;
	    var xlowExtent = d3.extent(chart.data, function(d) { return d.xlow; }),
	    xupExtent = d3.extent(chart.data, function(d) { return d.xup; }),
	    ylowExtent = d3.extent(chart.data, function(d) { return d.ylow; }),
	    yupExtent = d3.extent(chart.data, function(d) { return d.yup; });
	    chart.xScale.domain([xlowExtent[0], xupExtent[1]]);
	    chart.yScale.domain([ylowExtent[0],yupExtent[1]]);
	    var zMax = d3.max(chart.data, function(d) { return d.val; });
	    chart.zScale.domain([0,zMax/2,zMax]);
	    // (Re)draw the axes as we've changed the scale
	    chart.drawAxes();
	    chart.drawColorLabel();
	    return data;
	},
	drawColorLabel: function(transition){
	    
	    var chart = this;	    

	    var nCells = 20;

	    var legendItem = chart.areas.legend.selectAll(".legend")
	    	.data(chart.zScale.ticks(20).slice(0).reverse())
		.enter().append("g")
		.attr("class","legend")
	    	.attr("transform", function(d,i){return "translate("+(chart.width() + 70)+"," +(chart.height()/nCells + i *chart.height()/nCells)+")";});	    
	    
	    legendItem.append("rect")
		.attr("width",chart.height()/nCells)
		.attr("height",chart.height()/nCells)
		.style("fill",chart.zScale);

	    legendItem.append("text")
		.attr("x", chart.height()/nCells+5)
		.attr("y", 10)
		.attr("dy", ".35em")
		.text(String);
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
      chart.layers.line.attr('clip-path', 'url(#chartArea)');

      var updateScaleDomain = function(newDomain) {
        chart.xScale.domain(newDomain);
        chart.drawAxes(true);
        chart.layers.line.draw(chart.data);
      };

      var buttonWidth = 100,
          buttonHeight = 40,
          padding = 10;

      // Brushes for zooming
      var brush = d3.svg.brush()
        .x(chart.xScale)
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
                  (chart.width() + chart.margins.left - buttonWidth - padding) + ',' +
                  (chart.margins.top + padding) + ')'
              );
            // Add the rounded rectangle to act as a background
            clearG.append('rect')
              .attr('width', buttonWidth)
              .attr('height', buttonHeight)
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
          // 3. Clear the brush's extent
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
