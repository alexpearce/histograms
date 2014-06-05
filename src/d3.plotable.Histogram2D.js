(function(d3, undefined) {
  var Histogram2D = function(name, data) {
    return {
      name: name,
      data: data,
      xDomain: function() {
        var xLowExtent = d3.extent(this.data, function(d) { return d.xlow; }),
            xHighExtent = d3.extent(this.data, function(d) { return d.xup; });
        return [xLowExtent[0], xHighExtent[1]];
      },
      yDomain: function() {
        var yLowExtent = d3.extent(this.data, function(d) { return d.ylow; }),
            yHighExtent = d3.extent(this.data, function(d) { return d.yup; });
        return [yLowExtent[0], yHighExtent[1]];
      },
      zDomain: function() {
        var zMax = d3.max(this.data, function(d) { return d.val; });
        return [0, zMax/2, zMax];
      },
      draw: function(g, transition) {
        if (arguments.length === 0) {
          console.log('Cannot draw ' + this.name + ', no arguments given');
          return;
        }
        if (this._axes === undefined) {
          console.log('Cannot draw ' + this.name + ', no axes');
          return;
        }
        if (transition === undefined) {
          transition = false;
        }
        g.classed('Histogram', true);
        var axes = this.axes(),
            join = g.selectAll('rect').data(data),
            selection = transition === true ? join.transition().duration(250) : join;
        join.enter()
          .append('rect')
          .classed('tile', true);
        selection
          .attr('x', function(d) { return axes.xScale(d.xlow); })
          .attr('y', function(d) { return axes.yScale(d.yup); })
          .attr('width', function(d) { return axes.xScale(d.xup - d.xlow) - axes.xScale(0); })
          .attr('height', function(d) { return axes.yScale(0) - axes.yScale(d.yup - d.ylow); })
          .style('fill', function(d) { return axes.zScale(d.val); });
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
  d3.plotable.Histogram2D = Histogram2D;
})(window.d3);
