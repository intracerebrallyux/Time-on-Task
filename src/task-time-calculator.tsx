import React, { useState, useMemo } from 'react';
import { Calculator, Clock, BarChart3, TrendingUp } from 'lucide-react';

const TaskTimeCalculator = () => {
  const [rawInput, setRawInput] = useState('');
  const [parsedTimes, setParsedTimes] = useState([]);
  const [confidenceLevel, setConfidenceLevel] = useState(95);

  // Parse the input data when it changes
  const parseTimeData = (input) => {
    if (!input.trim()) {
      setParsedTimes([]);
      return;
    }

    const lines = input.split('\n');
    const times = [];
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed) {
        const value = parseFloat(trimmed);
        if (!isNaN(value) && value > 0) {
          times.push({
            raw: value,
            formatted: formatTime(value),
            lineNumber: index + 1
          });
        }
      }
    });
    
    setParsedTimes(times);
  };

  // Format seconds to MM:SS
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleInputChange = (e) => {
    setRawInput(e.target.value);
    parseTimeData(e.target.value);
  };

  // T-distribution critical values lookup table (two-tailed)
  const getTCritical = (df, confidenceLevel) => {
    const alpha = (100 - confidenceLevel) / 100;
    const tValues = {
      1: { 0.20: 3.078, 0.10: 6.314, 0.05: 12.706 },
      2: { 0.20: 1.886, 0.10: 2.920, 0.05: 4.303 },
      3: { 0.20: 1.638, 0.10: 2.353, 0.05: 3.182 },
      4: { 0.20: 1.533, 0.10: 2.132, 0.05: 2.776 },
      5: { 0.20: 1.476, 0.10: 2.015, 0.05: 2.571 },
      6: { 0.20: 1.440, 0.10: 1.943, 0.05: 2.447 },
      7: { 0.20: 1.415, 0.10: 1.895, 0.05: 2.365 },
      8: { 0.20: 1.397, 0.10: 1.860, 0.05: 2.306 },
      9: { 0.20: 1.383, 0.10: 1.833, 0.05: 2.262 },
      10: { 0.20: 1.372, 0.10: 1.812, 0.05: 2.228 },
      15: { 0.20: 1.341, 0.10: 1.753, 0.05: 2.131 },
      20: { 0.20: 1.325, 0.10: 1.725, 0.05: 2.086 },
      25: { 0.20: 1.316, 0.10: 1.708, 0.05: 2.060 },
      30: { 0.20: 1.310, 0.10: 1.697, 0.05: 2.042 }
    };
    
    const df_key = df <= 30 ? (df <= 10 ? df : (df <= 15 ? 15 : (df <= 20 ? 20 : (df <= 25 ? 25 : 30)))) : 30;
    return tValues[df_key][alpha] || 2.042;
  };

  // Calculate confidence intervals
  const calculateCI = useMemo(() => {
    if (parsedTimes.length < 2) return null;
    
    const times = parsedTimes.map(t => t.raw);
    const n = times.length;
    
    // Step 1: Log transform
    const logTimes = times.map(t => Math.log(t));
    
    // Step 2: Calculate mean and SD of log-transformed data
    const logMean = logTimes.reduce((sum, val) => sum + val, 0) / n;
    const logVariance = logTimes.reduce((sum, val) => sum + Math.pow(val - logMean, 2), 0) / (n - 1);
    const logSD = Math.sqrt(logVariance);
    
    // Step 3: Calculate SEM
    const sem = logSD / Math.sqrt(n);
    
    // Step 4: Get t-critical value
    const df = n - 1;
    const tCritical = getTCritical(df, confidenceLevel);
    
    // Step 5: Calculate margin
    const margin = tCritical * sem;
    
    // Step 6: CI bounds in log space
    const logLow = logMean - margin;
    const logHigh = logMean + margin;
    
    // Step 7: Exponentiate back to original scale
    const geometricMean = Math.exp(logMean);
    const ciLow = Math.exp(logLow);
    const ciHigh = Math.exp(logHigh);
    
    // Also calculate arithmetic mean for comparison
    const arithmeticMean = times.reduce((sum, val) => sum + val, 0) / n;
    
    return {
      n,
      geometricMean,
      arithmeticMean,
      logMean,
      logSD,
      sem,
      df,
      tCritical,
      margin,
      ciLow,
      ciHigh,
      confidenceLevel
    };
  }, [parsedTimes, confidenceLevel]);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Calculator className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Task Time Analysis</h1>
        </div>
        <p className="text-gray-600">
          Calculate confidence intervals for task completion times using geometric mean
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Confidence Level Configuration */}
        <div className="md:col-span-2 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confidence Level
            </label>
            <select
              value={confidenceLevel}
              onChange={(e) => setConfidenceLevel(Number(e.target.value))}
              className="w-48 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value={95}>95%</option>
              <option value={90}>90%</option>
              <option value={80}>80%</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Select the confidence level for interval calculations
            </p>
          </div>
        </div>

        {/* Input Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800">Raw Time Data</h2>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Enter task times (seconds) - one per line
            </label>
            <p className="text-xs text-gray-500">
              Example: 122 = 2 minutes 2 seconds. Paste from spreadsheet or type manually.
            </p>
          </div>

          <textarea
            value={rawInput}
            onChange={handleInputChange}
            placeholder="122
293
203
156
89
..."
            className="w-full h-64 p-3 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />

          <div className="text-sm text-gray-600">
            {parsedTimes.length > 0 ? (
              <span className="text-green-600 font-medium">
                ✓ {parsedTimes.length} valid time values detected
              </span>
            ) : (
              <span className="text-gray-400">Enter time data to begin analysis</span>
            )}
          </div>
        </div>

        {/* Preview Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-5 h-5 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-800">Data Preview</h2>
          </div>

          {parsedTimes.length > 0 ? (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="mb-4">
                <h3 className="font-medium text-gray-700 mb-2">Parsed Time Values:</h3>
                <div className="max-h-48 overflow-y-auto">
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="font-medium text-gray-600">#</div>
                    <div className="font-medium text-gray-600">Seconds</div>
                    <div className="font-medium text-gray-600">MM:SS</div>
                    {parsedTimes.map((time, index) => (
                      <React.Fragment key={index}>
                        <div className="text-gray-500">{index + 1}</div>
                        <div className="font-mono">{time.raw}</div>
                        <div className="font-mono text-blue-600">{time.formatted}</div>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <div className="text-sm text-gray-600">Sample Size</div>
                  <div className="text-lg font-semibold">{parsedTimes.length}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Range</div>
                  <div className="text-lg font-semibold">
                    {Math.min(...parsedTimes.map(t => t.raw))}s - {Math.max(...parsedTimes.map(t => t.raw))}s
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                Paste your time data to see the preview
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Each line should contain one time value in seconds
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Results Section */}
      {calculateCI && (
        <div className="mt-8 space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-6 h-6 text-green-600" />
            <h2 className="text-2xl font-semibold text-gray-800">Analysis Results</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Key Results */}
            <div className="bg-green-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-800 mb-4">Confidence Interval</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600">Geometric Mean</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {calculateCI.geometricMean.toFixed(1)}s
                  </div>
                  <div className="text-sm text-gray-500">
                    ({formatTime(calculateCI.geometricMean)})
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-600">{calculateCI.confidenceLevel}% Confidence Interval</div>
                  <div className="text-lg font-semibold text-green-700">
                    {calculateCI.ciLow.toFixed(1)}s - {calculateCI.ciHigh.toFixed(1)}s
                  </div>
                  <div className="text-sm text-gray-500">
                    ({formatTime(calculateCI.ciLow)} - {formatTime(calculateCI.ciHigh)})
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Statistics */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Detailed Statistics</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Sample Size (n)</div>
                  <div className="font-semibold">{calculateCI.n}</div>
                </div>
                <div>
                  <div className="text-gray-600">Degrees of Freedom</div>
                  <div className="font-semibold">{calculateCI.df}</div>
                </div>
                <div>
                  <div className="text-gray-600">Arithmetic Mean</div>
                  <div className="font-semibold">{calculateCI.arithmeticMean.toFixed(1)}s</div>
                </div>
                <div>
                  <div className="text-gray-600">t-Critical Value</div>
                  <div className="font-semibold">{calculateCI.tCritical.toFixed(3)}</div>
                </div>
                <div>
                  <div className="text-gray-600">Log Mean</div>
                  <div className="font-semibold">{calculateCI.logMean.toFixed(3)}</div>
                </div>
                <div>
                  <div className="text-gray-600">Standard Error</div>
                  <div className="font-semibold">{calculateCI.sem.toFixed(3)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Interpretation */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">Interpretation</h3>
            <p className="text-blue-700 text-sm leading-relaxed">
              We can be <strong>{calculateCI.confidenceLevel}% confident</strong> that the true geometric mean task completion time 
              falls between <strong>{calculateCI.ciLow.toFixed(1)} and {calculateCI.ciHigh.toFixed(1)} seconds</strong>. 
              The geometric mean ({calculateCI.geometricMean.toFixed(1)}s) is more appropriate than the arithmetic mean 
              ({calculateCI.arithmeticMean.toFixed(1)}s) for positively skewed time data.
            </p>
          </div>
        </div>
      )}

      {parsedTimes.length > 0 && !calculateCI && (
        <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
          <p className="text-yellow-800 text-sm">
            <strong>Note:</strong> Need at least 2 data points to calculate confidence intervals.
          </p>
        </div>
      )}

      {parsedTimes.length > 0 && calculateCI && (
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <p className="text-blue-800 text-sm">
            <strong>Results:</strong> Geometric mean = {calculateCI.geometricMean.toFixed(1)}s with {calculateCI.confidenceLevel}% CI: [{calculateCI.ciLow.toFixed(1)}s, {calculateCI.ciHigh.toFixed(1)}s]
          </p>
        </div>
      )}
    </div>
  );
};

export default TaskTimeCalculator;
