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
  var gaussian = [];
  var landau = [];
  for (var i = 0; i < gaussianData['values'].length; i++) {
    var bins = gaussianData['binning'][i];
    gaussian.push({
      x: bins[0],
      dx: bins[1],
      y: gaussianData['values'][i],
      xErr: gaussianData['uncertainties'][i]
    });
  }
  for (var i = 0; i < landauData['values'].length; i++) {
    var bins = landauData['binning'][i];
    landau.push({
      x: -bins[0],
      dx: -bins[1],
      y: landauData['values'][i],
      xErr: landauData['uncertainties'][i]
    });
  }
  var h = makeHistogram(d3.select('#h1'));
  h.draw(gaussian);
  var h = makeHistogram(d3.select('#h2'));
  h.draw(landau);
})(window, window.document);
