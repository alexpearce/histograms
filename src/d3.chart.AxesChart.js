(function(d3, undefined) {
  'use strict';
  d3.chart('BaseChart').extend('AxesChart', {
    initialize: function() {
      var chart = this;

      // Define blank x- and y-axis labels, zero the exponents
      chart._xAxisLabel = '';
      chart._yAxisLabel = '';
      chart._xExponent = 0;
      chart._yExponent = 0;

      // Transform scales: go from data coordinates (domain) to canvas coordinates (range)
      chart.xScale = d3.scale.linear()
        .range([0, chart.width()])
        .domain([0, 1]);
      chart.yScale = d3.scale.linear()
        .range([chart.height(), 0])
        .domain([0, 1]);
      chart.zScale = d3.scale.linear()
        .range(['#2c7bb6', '#ffffbf', '#d7191c'])
        .interpolate(d3.interpolateHcl);

      // Object of plotable objects
      // Each plotable is referenced by a key equal to its `name` property
      chart._plotables = {};
      // Object of plotable layers
      // Each plotable is drawn in its own "layer", a <g> element, referenced
      // by a key equal to the `name` property of the plotable
      chart._layers = {};

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

      // Create <g> elements for all axes
      // Each axis has three elements:
      //   1. Grid
      //   2. Bottom-left
      //   3. Top-right
      // They are defined in z-order, so grid below everything, then 2 and 3
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
      // Z color scale, drawn outside the chart bounding box
      chart.areas.legend = chart.base.append('g')
        .classed('legend', true)
        .attr('transform', 'translate(' + (chart.width() + chart.margins.left + 10) + ',' + chart.margins.top + ')');

      // Create <g> elements for axis labels and add the <text> elements to them
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

      // Create d3.svg.axis objects for each axis group, one per axis layer
      // The grid is made by creating axes with tick lengths equal to the chart width/height
      // Only the bottom-left set of axes get tick labels
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

      // Create formatters for the x- and y-axis
      // The callback updates the axis label when the ticks are updated
      var xFormatter = d3.chart.utilities.siTickFormatter(chart.xScale, chart.layers.xaxis, function(exp) {
        chart._xExponent = exp;
        chart.xAxisLabel(chart.xAxisLabel());
      });
      var yFormatter = d3.chart.utilities.siTickFormatter(chart.yScale, chart.layers.yaxis, function(exp) {
        chart._yExponent = exp;
        chart.yAxisLabel(chart.yAxisLabel());
      });
      chart.layers.xaxis.tickFormat(xFormatter);
      chart.layers.yaxis.tickFormat(yFormatter);

      // Add a clipping path to hide histogram outside chart area
      chart.clipPath = chart.base.append('defs').append('clipPath')
        .attr('id', 'chartArea-' + Math.random().toString(36).substring(7));
      var clipRect = chart.clipPath.append('rect')
        .attr('width', chart.width())
        .attr('height', chart.height());
      var updateScaleDomain = function(newXDomain, newYDomain) {
        chart.xScale.domain(newXDomain);
        chart.yScale.domain(newYDomain);
        chart.draw(true);
      };
      var buttonWidth = 100,
          buttonHeight = 40,
          padding = 10;
      // Brushes for zooming
      var brush = d3.svg.brush()
        .x(chart.xScale)
        .y(chart.yScale)
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
            chart.yScale.originalDomain = chart.yScale.domain();
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
                updateScaleDomain(chart.xScale.originalDomain, chart.yScale.originalDomain);
                clearG.remove();
              });
          }
          // 2. Update the x-axis domain
          var brushExtent = brush.extent(),
              xExtent = [brushExtent[0][0], brushExtent[1][0]],
              yExtent = [brushExtent[0][1], brushExtent[1][1]];
          updateScaleDomain(xExtent, yExtent);
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
      chart.on('change:width', function() {
        chart.xScale.range([0, chart.width()]);
        chart.areas.xlabel.attr('transform', 'translate(' + (chart.width() + chart.margins.left) + ',' + (chart.height() + chart.margins.top + chart.margins.bottom) + ')');
        chart.areas.yaxisright.attr('transform', 'translate(' + chart.width() + ', 0)');
        chart.layers.ygrid.tickSize(-chart.width(), 0, 0);
        clipRect.attr('width', chart.width());
        chart.areas.legend
          .attr('transform', 'translate(' + (chart.width() + chart.margins.left + 10) + ',' + chart.margins.top + ')');
        chart.draw();
      });
      chart.on('change:height', function() {
        chart.yScale.range([chart.height(), 0]);
        chart.areas.xaxis.attr('transform', 'translate(0,' + chart.height() + ')');
        chart.areas.xgrid.attr('transform', 'translate(0,' + chart.height() + ')');
        chart.areas.xlabel.attr('transform', 'translate(' + (chart.width() + chart.margins.left) + ',' + (chart.height() + chart.margins.top + chart.margins.bottom) + ')');
        chart.layers.xgrid.tickSize(-chart.height(), 0, 0);
        clipRect.attr('height', chart.height());
        chart.areas.brush
          .call(brush)
          .selectAll('rect')
          .attr('height', chart.height());
        chart.draw();
      });

      // Away we go!
      this.draw();
    },
    // Draw the chart.
    //
    // Owners of the chart object should not need to call this method directly.
    // It is invoked when the internal state of the chart would produce a
    // visual change.
    //
    // Returns the chart.
    draw: function(transition) {
      if (transition === undefined) {
          transition = false;
      }
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

      // Draw the plotables, one per layer
      var name,
          plotable;
      for (name in chart._plotables) {
        plotable = chart._plotables[name];
        plotable.draw(this._layers[name], transition);
        // If any plotable defines a z domain, draw the z-axis
        if (plotable.zDomain !== undefined) {
          chart.drawColorScale();
        }
      }

      return chart;
    },
    // Get or set the x-axis label.
    //
    // If no argument is given, the x-axis label is returned.
    // If a string is given, the x-axis label is set to this string and the
    // axis is redrawn.
    // The exponent of the axis domain, if non-zero, is appended to the label.
    //
    // Returns the x-axis label if no argument is given, else the chart.
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
    // Get or set the y-axis label.
    //
    // If no argument is given, the y-axis label is returned.
    // If a string is given, the y-axis label is set to this string and the
    // axis is redrawn.
    // The exponent of the axis domain, if non-zero, is appended to the label.
    //
    // Returns the y-axis label if no argument is given, else the chart.
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
    },
    // Returns the list of plotable objects belonging to the chart.
    plotables: function() {
      return this._plotables;
    },
    // Add a plotable to the chart.
    //
    // The axes and domains of the chart are recomputed and the chart redrawn.
    //
    // plotable - d3.plotable object to add.
    //
    // Returns the chart.
    addPlotable: function(plotable) {
      // Check the plotable object has the necessary properties
      var requiredProps = ['draw', 'name', 'axes', 'xDomain', 'yDomain'],
          plotableOK = requiredProps.every(function(prop) {
        return plotable[prop] !== undefined;
      });
      if (!plotableOK) {
        return;
      }
      // Add the axes to the plotable
      plotable.axes(this);
      this._plotables[plotable.name] = plotable;
      this._layers[plotable.name] = this.base.select('g')
        .insert('g', '.axis')
        .classed(plotable.name, true)
        // Applying the clipping path to the chart area
        .attr('clip-path', 'url(#' + this.clipPath.attr('id') + ')');
      this.setDomain();
      this.draw();
      return this;
    },
    // Remove the plotable with `name` property equal to `plotableName` from
    // the chart.
    //
    // plotableName - Name of the plotable to remove from the chart.
    //
    // Returns the chart.
    removePlotable: function(plotableName) {
      var chart = this;
      this._layers[plotableName].remove();
      delete this._plotables[plotableName];
      delete this._layers[plotableName];
      this.setDomain();
      this.draw();
      return this;
    },
    // Set the domain of the x, y, and z scales.
    //
    // Loop through each plotable calling their respective `{x,y,z}Domain`
    // methods, then set the chart's domain to the minimum and maximum values
    // found.
    //
    // Returns the chart.
    setDomain: function() {
      var name,
          plotable,
          xDomain = [],
          yDomain = [],
          zDomain = [],
          chart = this;
      for (name in chart._plotables) {
        plotable = chart._plotables[name];
        xDomain = d3.extent(plotable.xDomain().concat(xDomain));
        yDomain = d3.extent(plotable.yDomain().concat(yDomain));
        if (plotable.zDomain !== undefined) {
          zDomain = d3.extent(plotable.zDomain().concat(zDomain));
        }
        plotable.draw(this._layers[name]);
      }
      xDomain = xDomain.length === 0 ? [0, 1] : xDomain;
      yDomain = yDomain.length === 0 ? [0, 1] : yDomain;
      zDomain = zDomain.length === 0 ? [0, 1] : zDomain;
      chart.xScale.domain(xDomain);
      chart.yScale.domain(yDomain);
      chart.zScale.domain([zDomain[0], zDomain[1]/2, zDomain[1]]);
    },
    drawColorScale: function() {
      // TODO configurable cellWidth, tick number?
      var chart = this,
          ticks = chart.zScale.ticks(20).reverse(),
          tickDiff = Math.abs(ticks[0] - ticks[1]),
          cellWidth = 25,
          cellHeight = chart.height()/ticks.length,
          legendItem = chart.areas.legend.selectAll('.legend-item')
            .data(ticks)
            .enter()
              .append('g')
              .attr('class', 'legend-item')
              .attr('transform', function(d, i) { return 'translate(0, ' + (i*cellHeight) + ')'; });

      // Draw colour cells
      legendItem.append('rect')
        .attr('width', cellWidth)
        .attr('height', cellHeight)
        .style('fill', chart.zScale);

      // Draw tick label centered within and offset from the cell
      legendItem.append('text')
        .attr('x', cellWidth + 5)
        .attr('y', (cellHeight)/2)
        .attr('dy', '.35em')
        .text(String);

      // Draw bounding box around colour scale
      // We don't normally assume styles, but a fill certainly isn't desirable
      chart.areas.legend.append('rect')
        .attr('width', cellWidth)
        .attr('height', cellHeight*ticks.length)
        .classed('legend-box', true)
        .style('fill', 'none');
    }
  });
})(window.d3);
