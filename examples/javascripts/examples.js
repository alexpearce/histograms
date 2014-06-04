(function(window, document, undefined) {
  'use strict';
  var makeHistogram = function(container) {
    return container.append('svg')
      .chart('HistogramZoom')
      .width(300)
      .height(250)
      .xAxisLabel('Vertex position [mm]')
      .yAxisLabel('Frequency');
  };

  var make2DHistogram = function(container) {
    return container.append('svg')
      .chart('Histogram2D')
      .width(600)
      .height(450)
      .xAxisLabel('x')
      .yAxisLabel('y');
  };
  // Manipulate the input data to a format accepted by the Histogram chart
  var formatData = function(data) {
    var rtn = [];
    for (var i = 0; i < data['values'].length; i++) {
      var bins = data['binning'][i];
      rtn.push({
        x: bins[0],
        dx: bins[1],
        y: data['values'][i],
        xErr: data['uncertainties'][i]
      });
    }
    return rtn;
  };

  // Define our datasets
  var gaussian = {
    title: 'Gaussian',
    colour: 'red',
    values: formatData(gaussianData)
  };
  var landau = {
    title: 'Landau',
    colour: 'green',
    values: formatData(landauData)
  };
  var steps = {
    title: 'Steps',
    colour: 'blue',
    values: formatData({
        'values': [0, 10, 20, 30, 40, 50],
        'binning': [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6]],
        'uncertainties': [0]
    })
  };

  // Draw charts
  var hMulti = makeHistogram(d3.select('#h1')),
      hLandau = makeHistogram(d3.select('#h2')),
      hTest = makeHistogram(d3.select('#h3'));
  var h2DGauss = make2DHistogram(d3.select('#h4'));

  // Add data
  hMulti.draw([gaussian, landau, steps]);
  hLandau.draw([landau]);
  hTest.draw([steps]);
  h2DGauss.draw(data2d);
})(window, window.document);
