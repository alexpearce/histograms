(function(window, document, undefined) {
  'use strict';
  // Create an SVG element and create an AxesChart inside it
  var makeChart = function(container) {
    return container.append('svg')
      .chart('AxesChart')
      .width(450)
      .height(400);
  };

  // Manipulate the input data to a format accepted by the Histogram chart
  var formatData = function(data) {
    var rtn = [];
    for (var i = 0; i < data['values'].length; i++) {
      var bins = data['binning'][i];
      rtn.push({
        xlow: bins[0],
        xhigh: bins[1],
        y: data['values'][i],
        yerr: data['uncertainties'][i]
      });
    }
    return rtn;
  };

  // Return an array of objects suitable for d3.plotables.LineChart, filled
  // with data generated from the function f, which should return a single
  // number when passed a single number.
  // The function is evaluated from domain[0] to domain[1] (domain[1] > domain[0])
  // in the given number of steps (default: 100).
  var dataFromFunction = function(f, domain, steps) {
    if (steps === undefined) {
      steps = 100;
    }
    var step = (domain[1] - domain[0])/(1.0*steps),
        x = domain[0],
        data = [];
    for (var i = 0; i <= steps; i++) {
      data.push({
        x: x,
        y: f(x),
        xerr: [0, 0],
        yerr: [0, 0]
      });
      x = i*step + domain[0];
    }
    return data;
  };

  // Define histogram datasets
  var gaussian = formatData(gaussianData),
      landau = formatData(landauData),
      steps = formatData({
        'values': [0, 1, 2, 3, 4, 5],
        'binning': [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6]],
        'uncertainties': [[0, 0.2], [0.2, 0.7], [0.3, 0.2], [0.2, 0.2], [0.2, 0.3], [0.2, 0.6]]
      });

  // Generate some line chart data
  var sinc = dataFromFunction(function(x) {
        return x == 0 ? 1 : Math.sin(Math.PI*x)/(Math.PI*x);
      }, [-2*Math.PI, 2*Math.PI]),
      line = [
        {x: -6, y: 0.4, xerr: [0.3, 0.3], yerr: [0.1, 0.1]},
        {x: -4, y: 0.6, xerr: [0.3, 0.3], yerr: [0.1, 0.1]},
        {x: -2, y: 0.4, xerr: [0.3, 0.3], yerr: [0.1, 0.1]},
        {x: 0, y: 0.0, xerr: [0.3, 0.3], yerr: [0.1, 0.1]},
        {x: 2, y: 0.2, xerr: [0.3, 0.3], yerr: [0.1, 0.1]},
        {x: 4, y: 0.8, xerr: [0.3, 0.3], yerr: [0.1, 0.1]},
        {x: 6, y: 0.6, xerr: [0.3, 0.3], yerr: [0.1, 0.1]}
      ];

  // Define our charts
  var hGauss = makeChart(d3.select('#h1'))
      .xAxisLabel('Vertex position [mm]')
      .yAxisLabel('Frequency');
  var h2DGauss = makeChart(d3.select('#h2'))
      .xAxisLabel('x')
      .yAxisLabel('y')
      .animate(false);
  var lineChart = d3.select('#h3').append('svg')
      .chart('AxesChart')
      .width(450)
      .height(400);

  var gaussianInfo = [
    ['Name', 'Gaussian'],
    ['Entries', '10000'],
    ['Mean', '0.0'],
    ['RMS', '1.0']
  ];

  // Draw plotables on to charts
  hGauss.addPlotable(d3.plotable.Histogram('steps', steps, {showUncertainties: true}));
  hGauss.addPlotable(d3.plotable.Histogram('gaussian', gaussian));
  hGauss.addPlotable(d3.plotable.Histogram('landau', landau));
  hGauss.addOrnament(d3.plotable.TextBox('gaussianInfo', gaussianInfo));
  h2DGauss.addPlotable(d3.plotable.Histogram2D('gaussian2d', data2d.data));
  lineChart.addPlotable(d3.plotable.LineChart('sinc', sinc));
  lineChart.addPlotable(d3.plotable.LineChart('line', line, {showPoints: true, showUncertainties: true, interpolation: 'linear', color: 'green'}));
})(window, window.document);
