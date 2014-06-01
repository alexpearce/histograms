(function(d3, undefined) {
  'use strict';
  d3.chart('Histogram').extend('HistogramZoom', {
    initialize: function() {
      var chart = this;
      chart.base.classed('HistogramZoom', true);

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
