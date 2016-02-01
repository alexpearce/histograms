## [Master](https://github.com/alexpearce/histograms/tree/master)

## [0.0.7](https://github.com/alexpearce/histograms/tree/v0.0.7)

This release introduces configuration at initialisation, where
some chart properties must be configured when the constructor
is called. See [the documentation](https://github.com/alexpearce/histograms/blob/d61440c75a241c93a06c986a44384baa710a84b4/src/d3.chart.AxesChart.js#L20-L41) 
for more.

Features:

  - Empty histogram bins are left blank (no colour)
  - Add logarithmic scales for all axes.
  - Add time scale for x-axis.
  - Allow SI exponent formatter to be disabled.

## [0.0.6](https://github.com/alexpearce/histograms/tree/v0.0.6)

Features:

  - Transitions can be toggled by the user with `chart.animate()`.

Bugfixes:

  - Adding z colour scale now doesn't change the SVG element size.

## [0.0.5](https://github.com/alexpearce/histograms/tree/v0.0.5)

Features:

  - Histogram plotable can display asymmetric uncertainties with the `showUncertainties` configuration option.
  - New `d3.plotables.LineChart` for drawing line charts.

Bugfixes:

  - 2D data was incorrectly sourced on the examples page.

## [0.0.4](https://github.com/alexpearce/histograms/tree/v0.0.4)

Features:

  - Configurable minimum shown `y` value on Histogram plotables with `yMinimum` configuration option.

Bugfixes:

  - Histogram didn't draw first bin.
