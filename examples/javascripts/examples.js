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

  // Define our datasets
  var gaussian = formatData(gaussianData),
      landau = formatData(landauData),
      steps = formatData({
        'values': [0, 1, 2, 3, 4, 5],
        'binning': [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6]],
        'uncertainties': [0, 0, 0, 0, 0, 0]
      });

  // Define our charts
  var hGauss = makeChart(d3.select('#h1'))
      .xAxisLabel('Vertex position [mm]')
      .yAxisLabel('Frequency');
  var h2DGauss = makeChart(d3.select('#h2'))
      .xAxisLabel('x')
      .yAxisLabel('y');

  var gaussianInfo = [
    ['Name', 'Gaussian'],
    ['Entries', '10000'],
    ['Mean', '0.0'],
    ['RMS', '1.0']
  ];

  // Draw plotables on to charts
  hGauss.addPlotable(d3.plotable.Histogram('steps', steps));
  hGauss.addPlotable(d3.plotable.Histogram('gaussian', gaussian));
  hGauss.addPlotable(d3.plotable.Histogram('landau', landau));
  hGauss.addOrnament(d3.plotable.TextBox('gaussianInfo', gaussianInfo));
  h2DGauss.addPlotable(d3.plotable.Histogram2D('gaussian2d', data2d.data));
})(window, window.document);
