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
      chart.base.classed('BaseChart', true);

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
