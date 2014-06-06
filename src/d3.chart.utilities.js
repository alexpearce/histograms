(function(window, d3, undefined) {
  var utilities = {
    // Compute the base-10 exponent of the absolute value of x.
    //
    // If you wrote the argument in scientific notation, this will return the
    // exponent.
    //
    // Examples
    //
    //   // 123000 would be written in scientific notation as 1.23e5, so:
    //   exponent(123000)
    //   // returns 5
    //
    // x - Floating point number to evaluate the exponent of.
    //
    // Returns the base-10 exponent for x.
    exponent: function(x) {
      return Math.floor(Math.log(Math.abs(x))/Math.LN10);
    },

    // Return the appropriate SI-prefix exponent for the array of tick values.
    //
    // The exponent is the maximum exponent within the ticks, rounded down to
    // the nearest multiple of three.
    // This is more familiar, matching SI prefixes (kilo 10^3, mega 10^6, etc.).
    //
    // ticks - Array of tick values.
    //
    // Returns the exponent.
    ticksExponent: function(ticks) {
      // Calculate the [minimum, maximum] tick values,
      // then the base-10 exponent for these min/max values
      // Use the biggest exponent as the one we show
      var oldTicks = ticks,
          extent = d3.extent(oldTicks),
          minExponent = d3.chart.utilities.exponent(extent[0]),
          maxExponent = d3.chart.utilities.exponent(extent[1]),
          exp = d3.max([maxExponent, minExponent]);
      return 3*Math.floor(exp/3);
    },

    // Create a tick formatter function for SI-prefix formatted tick labels.
    //
    // A nice precision is one fine enough such that adjacent ticks aren't
    // rounded to be equal.
    // For example, two adajacent ticks with values (0.998, 0.999) require
    // three digits of precision, whereas (12.5, 23.5) requires zero
    // This method assumes all ticks are spaced equally apart.
    //
    // scale - d3.scale to generate ticks.
    // axis - d3.svg.axis which defines the number of ticks.
    // callback - Optional function to be invoked whenever the tick formatter
    //            is. The function is passed the exponent used to format
    //            the tick labels.
    //
    // Returns a  tick formatter function which accepts a value and a tick
    // number, itself return an appropriately round tick label.
    siTickFormatter: function(scale, axis, callback) {
      // By placing this logic inside the returned function, the values
      // are updated on each call
      // Placing them outside would result in stale `ticks` and `exp` values
      return function(value, tickNumber) {
        var ticks = scale.ticks(axis.ticks()[0]),
            exp = utilities.ticksExponent(ticks),
            newTicks = ticks.map(function(d) { return d/Math.pow(10, exp); } );
        var expDiff = d3.chart.utilities.exponent(newTicks[0] - newTicks[1]);
        expDiff = expDiff < 0 ? Math.abs(expDiff) : 0;
        if (typeof callback === 'function') {
          callback(exp);
        }
        return (value/Math.pow(10, exp)).toFixed(expDiff);
      };
    }
  };

  // Expose our utilities in the d3 object
  d3.chart.utilities = utilities;
})(window, window.d3);
