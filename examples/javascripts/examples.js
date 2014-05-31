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
      .chart('2DHistogram')
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
  var gaussian = formatData(gaussianData),
      landau = formatData(landauData);
  var hGauss = makeHistogram(d3.select('#h1')),
      hLandau = makeHistogram(d3.select('#h2')),
      hTest = makeHistogram(d3.select('#h3'));
  var h2DGauss = make2DHistogram(d3.select('#h4'));

  hGauss.draw(gaussian);
  hLandau.draw(landau);
  hTest.draw(formatData({
    'values': [0, 1, 2, 3, 4, 5],
    'binning': [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6]],
    'uncertainties': [0]
  }));
  h2DGauss.draw(data2d);
})(window, window.document);
