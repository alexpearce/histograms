(function(d3, undefined) {
  'use strict';
  d3.chart('AxesChart').extend('Histogram2D', {
    initialize: function() {
      var chart = this;
      chart.base.classed('Histogram2D', true);

      //Transfom scale for the z-axis
      chart.zScale = d3.scale.linear()
        .range(['#2c7bb6', '#ffffbf', '#d7191c'])
        .interpolate(d3.interpolateHcl);

      // Get inner 'canvas'
      var innerG = chart.base.select('g');

      //gain space on the right in order to insert the zscale
      chart.margins.right = 100;

      //legend for Z axis
      chart.areas.legend = chart.base.append('g')
        .classed('legend', true)
        .attr('transform', function(d, i) { return 'translate(' + (chart.width() + chart.margins.left + 10) + ',' + chart.margins.top + ')'; });

      // add the tiles to layers
      // Adding them before the x-axis
      chart.layers.tiles = innerG.insert('g', ':first-child')
        .classed('tiles', true);

      chart.on('change:width', function() {
        chart.areas.legend
          .attr('transform', function(d, i) { return 'translate(' + (chart.width() + chart.margins.left + 10) + ',' + chart.margins.top + ')'; });
      });

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
              .attr('x', function(d) { return chart.xScale(d.xlow); })
              .attr('y', function(d) { return chart.yScale(d.yup); })
              .attr('width', function(d) { return chart.xScale(d.xup - d.xlow) - chart.xScale(0); })
              .attr('height', function(d) { return chart.yScale(0) - chart.yScale(d.yup - d.ylow); })
              .style('fill', function(d) { return chart.zScale(d.val); });
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
      chart.yScale.domain([ylowExtent[0], yupExtent[1]]);
      var zMax = d3.max(chart.data, function(d) { return d.val; });
      chart.zScale.domain([0, zMax/2, zMax]);
      // (Re)draw the axes as we've changed the scale
      chart.drawAxes();
      chart.drawColorLabel();
      return data;
    },
    drawColorLabel: function() {
      // TODO configurable cellWidth, tick number?
      var chart = this,
          ticks = chart.zScale.ticks(20).reverse(),
          tickDiff = Math.abs(ticks[0] - ticks[1]),
          cellWidth = 25,
          cellHeight = chart.height()/ticks.length,
          legendItem = chart.areas.legend.selectAll('.legend-item')
            .data(ticks)
            .enter().append('g')
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
