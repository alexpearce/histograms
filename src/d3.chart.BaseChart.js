/*
 * d3.chart.BaseChart
 *
 * d3.chart which provides a sane base to build other charts with.
 * Allows derivatives to easily adhere to the D3 margin convention [1] using
 * `width` and `height` methods.
 *
 * [1]: http://bl.ocks.org/mbostock/3019563
 *
 * Properties
 * ----------
 *
 * Properties considered public are:
 *
 * * `margins`: Object defining `top`, `bottom`, `left`, and `right` margins in
 *              pixels.
 * * `width`: Getter/setter method for the chart width
 * * `height`: Getter/setter method for the chart height
 *
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
        right: 100,
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

    /* Chart width setter/getter.
     *
     * newWidth - Width to set the chart area in pixels.
     *
     * Returns the chart width if newWidth is undefined, else the chart.
     */
    width: function(newWidth) {
      var chart = this;
      if (arguments.length === 0) {
        return chart._width;
      }
      var oldWidth = chart._width;
      chart._width = newWidth;
      chart.updateContainerWidth();
      chart.trigger('change:width', newWidth, oldWidth);
      return chart;
    },

    /* Chart height setter/getter.
     *
     * newHeight - Height to set the chart area in pixels.
     *
     * Returns the chart height if newHeight is undefined, else the chart.
     */
    height: function(newHeight) {
      var chart = this;
      if (arguments.length === 0) {
        return chart._height;
      }
      var oldHeight = chart._height;
      chart._height = newHeight;
      chart.updateContainerHeight();
      chart.trigger('change:height', newHeight, oldHeight);
      return chart;
    },

    /* Set the width of the chart's root SVG.
     */
    updateContainerWidth: function() {
      this.base
        .attr('width', this._width + this.margins.left + this.margins.right);
    },

    /* Set the height of the chart's root SVG.
     */
    updateContainerHeight: function() {
      this.base
        .attr('height', this._height + this.margins.top + this.margins.bottom);
    }
  });
})(window.d3);
