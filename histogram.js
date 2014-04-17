(function(window, document, undefined) {
  'use strict';
  var makeHistogram = function(container) {
    return container.append('svg')
      .chart('HistogramZoom')
      .width(300)
      .height(250);
  };
  var binnedData = [];
  for (var i = 0; i < histogramData['values'].length; i++) {
    var bins = histogramData['binning'][i];
    binnedData.push({
      x: bins[0],
      dx: bins[1],
      y: histogramData['values'][i],
      xErr: histogramData['uncertainties'][i]
    });
  }
  makeHistogram(d3.select('#h1')).draw(binnedData);
  makeHistogram(d3.select('#h2')).draw(binnedData);
})(window, window.document);
