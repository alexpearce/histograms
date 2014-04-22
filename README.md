Histograms
==========

Plot [histograms](https://en.wikipedia.org/wiki/Histogram) with [D3](http://d3js.org/).

Contributing
------------

All the JavaScript files are under `src/`.
To build the production scripts `d3.chart.histograms.js` and `d3.chart.histograms.min.js` you'll need [Grunt](http://gruntjs.com/).

Clone the repository

    git clone https://github.com/alexpearce/histograms.git

and then install the development dependencies

    npm install .

Finally, run

    grunt

The output is placed in `dist/`.

To have Grunt monitor files in `src/` during development, run `grunt watch`.
Grunt will automatically update the files in `dist/`, and alert you of any syntax errors with [JSHint](http://www.jshint.com/).

License
-------

Released under the [MIT license](http://mit-license.org/).
