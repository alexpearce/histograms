/*
 * d3.chart.AxesChart
 *
 * d3.chart which draws a set of axes and contained plotables.
 *
 * AxesChart derives from BaseChart, inheriting all of its properties.
 *
 * Properties
 * ----------
 *
 * Properties considered public are:
 *
 * * `xScale`: The d3.scale of the x axis
 * * `yScale`: The d3.scale of the y axis
 * * `zScale`: The d3.scale of the z axis
 * * `xAxisLabel`: Getter/setter method for the x-axis label
 * * `yAxisLabel`: Getter/setter method for the y-axis label
 *
 * Axes
 * ----
 *
 * AxesChart is responsible for drawing axes and their containing d3.plotables.
 * The x and y axes are drawn as two axes and a grid. The x axis is drawn
 * below and above the plot area, and the y axis is drawn left and right.
 * Only the x axis on the bottom and y axis on the left are given labels, but
 * all axes and given tick markings.
 * Both axes are formatted in SI notation, meaning that if the tick numbers
 * are large enough to warrant an exponent, the exponent is rounded to the
 * nearest multiple of three (e.g. 10^3, 10^-9).
 * A z axis, if required, is drawn to the right of the plot area.
 *
 * Plotables
 * ---------
 *
 * A plotable is an object in d3.plotable.
 * Each plotable defines an object that can be drawn within a set of axes, such
 * as a histogram, a function, or a scatter plot.
 * Each plotable is responsible for drawing itself and reporting several of its
 * properties, and so must define the following properties:
 *
 * * `name`: Property holding the name of the plotable, which must be unique
 *           within an AxesChart instance, as stored plotables are referenced
 *           by their name
 * * `xDomain`: Method returning the extent the the plotable along the x axis
 * * `yDomain`: Method returning the extent of the plotable along the y axis
 * * `draw`: Method which draws the histogram, accepting the AxesChart instance
 *           calling the method, the <g> container within which the plotable
 *           should draw itself, and a boolean stating whether the plotable
 *           should animate its drawing or not
 *
 * Thus, a complete but boring d3.plotables implementation might look like:
 *
 *   d3.plotables.MyPlotable = {
 *     name: 'MyPlotable',
 *     xDomain: function() { return [0, 0]; },
 *     yDomain: function() { return [0, 0]; },
 *     draw: function(axes, g, transition) { return; }
 *   };
 *
 * Plotables are added to AxesChart using the `addPlotable` method, and are
 * removed with `removePlotable`.
 *
 * Ornaments
 * ---------
 *
 * An ornament object can be identical to a plotable object, but is treated
 * slightly differently by AxesChart, namely they should not depend on the
 * scales of the axes, and so they:
 *
 * * Are not redrawn on scale changes, but are drawn once on
 *   `AxesChart.addOrnament`
 * * Do not have a clipping path applied to them
 * * Are drawn above all plotables, axes, ticks, labels, etc.
 *
 * Ornaments must implement the `name` and `draw` methods, as for plotables,
 * but are not required to implement the `xDomain` and `yDomain` methods.
 *
 */
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
      // Object of ornament objects
      // Each ornament is referenced by a key equal to its `name` property
      chart._ornaments = {};
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
      chart.areas.zscale = chart.base.append('g')
        .classed('zscale', true)
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

      // Define 'Clear zoom' button dimensions
      var buttonWidth = 100,
          buttonHeight = 40,
          padding = 10,
          brush = d3.svg.brush();
      var brushend = function() {
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
      };
      // Set up zooming behaviour in x and y using d3.svg.brush
      brush
        .x(chart.xScale)
        .y(chart.yScale)
        .on('brushend', brushend);
      // Add the brush to the canvas
      chart.areas.brush = chart.base.append('g')
        .classed('brush', true)
        .attr('transform', 'translate(' + chart.margins.left + ', ' + chart.margins.top + ')');
      chart.areas.brush.call(brush);

      // Update width/height dependent elements on change
      chart.on('change:width', function() {
        chart.xScale.range([0, chart.width()]);
        chart.areas.xlabel.attr('transform', 'translate(' + (chart.width() + chart.margins.left) + ',' + (chart.height() + chart.margins.top + chart.margins.bottom) + ')');
        chart.areas.yaxisright.attr('transform', 'translate(' + chart.width() + ', 0)');
        chart.layers.ygrid.tickSize(-chart.width(), 0, 0);
        clipRect.attr('width', chart.width());
        chart.areas.zscale
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
        chart.areas.brush.call(brush);
        chart.draw();
      });

      // Away we go!
      chart.draw();
    },

    /*
     * Draw the chart.
     *
     * Owners of the chart object should not need to call this method directly.
     * It is invoked when the internal state of the chart would produce a
     * visual change.
     *
     * Returns the chart.
     */
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
        plotable.draw(chart, chart._layers[name], transition);
        // If any plotable defines a z domain, draw the z-axis
        if (plotable.zDomain !== undefined) {
          chart.drawColorScale();
        }
      }

      return chart;
    },

    /* Get or set the x-axis label.
     *
     * If no argument is given, the x-axis label is returned.
     * If a string is given, the x-axis label is set to this string and the
     * axis is redrawn.
     * The exponent of the axis domain, if non-zero, is appended to the label.
     *
     * Returns the x-axis label if no argument is given, else the chart.
     */
    xAxisLabel: function(newLabel) {
      var chart = this;
      if (arguments.length === 0) {
        return chart._xAxisLabel;
      }
      chart._xAxisLabel = newLabel;
      // Append the value of the exponent, if there is one
      if (chart._xExponent !== 0) {
        chart.areas.xlabel.select('text')
          .text(chart.xAxisLabel() + ' ×1e' + chart._xExponent);
      } else {
        chart.areas.xlabel.select('text')
          .text(chart.xAxisLabel());
      }
      return chart;
    },

    /* Get or set the y-axis label.
     *
     * If no argument is given, the y-axis label is returned.
     * If a string is given, the y-axis label is set to this string and the
     * axis is redrawn.
     * The exponent of the axis domain, if non-zero, is appended to the label.
     *
     * Returns the y-axis label if no argument is given, else the chart.
     */
    yAxisLabel: function(newLabel) {
      var chart = this;
      if (arguments.length === 0) {
        return chart._yAxisLabel;
      }
      chart._yAxisLabel = newLabel;
      // Append the value of the exponent, if there is one
      if (chart._yExponent !== 0) {
        chart.areas.ylabel.select('text')
          .text(chart.yAxisLabel() + ' ×1e' + chart._yExponent);
      } else {
        chart.areas.ylabel.select('text')
          .text(chart.yAxisLabel());
      }
      return chart;
    },

    /* Returns the list of plotable objects belonging to the chart.
     */
    plotables: function() {
      return this._plotables;
    },

    /* Add a plotable to the chart.
     *
     * The axes and domains of the chart are recomputed and the chart redrawn.
     *
     * plotable - d3.plotable object to add.
     *
     * Returns the chart.
     */
    addPlotable: function(plotable) {
      var chart = this,
          // Check the plotable object has the necessary properties
          requiredProps = ['draw', 'name', 'xDomain', 'yDomain'],
          plotableOK = requiredProps.every(function(prop) {
            return plotable[prop] !== undefined;
          });
      if (!plotableOK) {
        return;
      }
      chart._plotables[plotable.name] = plotable;
      chart._layers[plotable.name] = chart.base.select('g')
        .insert('g', '.axis')
        .classed(plotable.name, true)
        // Applying the clipping path to the chart area
        .attr('clip-path', 'url(#' + chart.clipPath.attr('id') + ')');
      chart.setDomain();
      chart.draw();
      return chart;
    },

    /* Remove the plotable with `name` property equal to `plotableName` from
     * the chart.
     *
     * plotableName - Name of the plotable to remove from the chart.
     *
     * Returns the chart.
     */
    removePlotable: function(plotableName) {
      var chart = this;
      chart._layers[plotableName].remove();
      delete chart._plotables[plotableName];
      delete chart._layers[plotableName];
      chart.setDomain();
      chart.draw();
      return chart;
    },

    /* Returns the list of plotable objects registered as ornaments belonging
     * to the chart
     */
    ornaments: function() {
      return this._ornaments;
    },

    /* Add a ornament to the chart.
     *
     * As ornaments do not depend on the scale, the domains are not recomputed
     * and the chart and other plotables are not redrawn.
     *
     * ornament - d3.plotable object to add as an ornament.
     *
     * Returns the chart.
     */
    addOrnament: function(ornament) {
      var chart = this,
          // Check the ornament object has the necessary properties
          requiredProps = ['draw', 'name'],
          ornamentOK = requiredProps.every(function(prop) {
            return ornament[prop] !== undefined;
          });
      if (!ornamentOK) {
        return;
      }
      chart._ornaments[ornament.name] = ornament;
      chart._layers[ornament.name] = chart.base.append('g')
        .classed(ornament.name, true);
      ornament.draw(chart, chart._layers[ornament.name]);
      return chart;
    },

    /* Remove the ornament with `name` property equal to `ornamentName` from
     * the chart.
     *
     * ornamentName - Name of the ornament to remove from the chart.
     *
     * Returns the chart.
     */
    removeOrnament: function(ornamentName) {
      var chart = this;
      chart._layers[ornamentName].remove();
      delete chart._ornaments[ornamentName];
      delete chart._layers[ornamentName];
      return chart;
    },

    /* Set the domain of the x, y, and z scales.
     *
     * Loop through each plotable calling their respective `{x,y,z}Domain`
     * methods, then set the chart's domain to the minimum and maximum values
     * found.
     *
     * Returns the chart.
     */
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
        plotable.draw(chart, chart._layers[name]);
      }
      xDomain = xDomain.length === 0 ? [0, 1] : xDomain;
      yDomain = yDomain.length === 0 ? [0, 1] : yDomain;
      zDomain = zDomain.length === 0 ? [0, 1] : zDomain;
      chart.xScale.domain(xDomain);
      chart.yScale.domain(yDomain);
      chart.zScale.domain([zDomain[0], zDomain[1]/2, zDomain[1]]);
    },

    /* Draw the z scale.
     *
     * Adds 70 pixels to the right margin to make room for the scale.
     *
     * Returns the chart.
     */
    drawColorScale: function() {
      // TODO configurable cellWidth, tick number?
      var chart = this,
          ticks = chart.zScale.ticks(20).reverse(),
          tickDiff = Math.abs(ticks[0] - ticks[1]),
          cellWidth = 25,
          cellHeight = chart.height()/ticks.length,
          zscaleItem = chart.areas.zscale.selectAll('.zscale-item')
            .data(ticks)
            .enter()
              .append('g')
              .attr('class', 'zscale-item')
              .attr('transform', function(d, i) { return 'translate(0, ' + (i*cellHeight) + ')'; });

      // Add 70px to the right-side margin to make room for the scale
      // We don't want to add the margin multiple times, so check/create a flag
      if (chart._hasZScale !== true) {
        chart.margins.right += 70;
        chart.updateContainerWidth();
        chart._hasZScale = true;
      }

      // Draw colour cells
      zscaleItem.append('rect')
        .attr('width', cellWidth)
        .attr('height', cellHeight)
        .style('fill', chart.zScale);

      // Draw tick label centered within and offset from the cell
      zscaleItem.append('text')
        .attr('x', cellWidth + 5)
        .attr('y', (cellHeight)/2)
        .attr('dy', '.35em')
        .text(String);

      // Draw bounding box around colour scale
      // We don't normally assume styles, but a fill certainly isn't desirable
      chart.areas.zscale.append('rect')
        .attr('width', cellWidth)
        .attr('height', cellHeight*ticks.length)
        .classed('zscale-box', true)
        .style('fill', 'none');
    }
  });
})(window.d3);
