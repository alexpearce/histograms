(function(d3, undefined) {
  var Histogram = function(name, data) {
    return {
      name: name,
      data: data,
      xDomain: function() {
        var xExtent = d3.extent(this.data, function(d) { return d.x; }),
            dxExtent = d3.extent(this.data, function(d) { return d.dx; }),
            xPadding = 0.05*Math.abs(xExtent[0] - xExtent[1]);
        return [xExtent[0] - xPadding, dxExtent[1] + xPadding];
      },
      yDomain: function() {
        var yExtent = d3.extent(this.data, function(d) { return d.y; });
        return [yExtent[0], 1.05*yExtent[1]];
      },
      draw: function(g, transition) {
        if (arguments.length === 0) {
          console.log('Cannot draw ' + this.name + ', no arguments given');
          return;
        }
        if (transition === undefined) {
          transition = false;
        }
        if (this.axes() === undefined) {
          console.log('Cannot draw ' + this.name + ', no axes');
          return;
        }
        g.classed('Histogram2D', true);
        var axes = this.axes(),
            linearea = d3.svg.area()
              .interpolate('step-before')
              .x(function(d) { return axes.xScale(d.dx); })
              .y1(function(d) { return axes.yScale(d.y); })
              .y0(function(d) { return d3.max(axes.yScale.range()); }),
            join = g.selectAll('path').data([this.data]),
            selection = transition === true ? join.transition().duration(250) : join;
        join.enter()
          .append('path')
          .classed('line', true)
          .attr('fill', 'none')
          .attr('stroke', 'rgb(38, 17, 150)');
        selection.attr('d', linearea);
      },
      axes: function(newAxes) {
        if (arguments.length === 0) {
          return this._axes;
        }
        this._axes = newAxes;
      }
    };
  };
  d3.plotable = d3.plotable || {};
  d3.plotable.Histogram = Histogram;
})(window.d3);
