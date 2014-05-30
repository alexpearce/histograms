(function(d3, undefined) {
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
