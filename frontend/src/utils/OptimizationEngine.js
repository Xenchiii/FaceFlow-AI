// src/utils/OptimizationEngine.js

/**
 * OPTIMIZATION ALGORITHM: Dynamic Resource Allocation
 * Uses Little's Law (L = λW) and M/M/1 Queue Theory approximations
 * to determine the optimal number of service points.
 */

export const calculateOptimalStations = (
  arrivalRatePerMin,    // How many students arriving per minute
  avgProcessingTimeSec, // How long it takes to scan one student
  targetMaxQueue = 5    // Maximum acceptable line length
) => {
  if (!arrivalRatePerMin || arrivalRatePerMin <= 0) return 1;

  // 1. Convert Arrival Rate to λ (students per second)
  const lambda = arrivalRatePerMin / 60;

  // 2. Service Rate μ (students per second per station)
  // If processing takes 5 seconds, μ = 1/5 = 0.2 students/sec
  const mu = 1 / (avgProcessingTimeSec || 5); 

  // 3. Calculate Traffic Intensity (ρ)
  // ρ = λ / μ
  const trafficIntensity = lambda / mu;

  // 4. Optimization Loop
  // Find minimum stations (c) where the system is stable (ρ/c < 1)
  // AND estimated queue length is below target.
  let stations = 1;
  while (true) {
    // Utilization factor per station
    const rho = trafficIntensity / stations;

    // If rho >= 1, the queue grows infinitely (unstable), need more stations
    if (rho >= 0.95) {
      stations++;
      continue;
    }

    // Estimate Queue Length (Lq) using simplified approximation
    const Lq = (Math.pow(trafficIntensity, 2)) / (stations * (1 - rho));

    if (Lq <= targetMaxQueue) {
      break;
    }
    stations++;
    
    // Safety break
    if (stations > 20) break;
  }

  return {
    recommendedStations: stations,
    currentLoad: (trafficIntensity / stations * 100).toFixed(1),
    estimatedQueue: Math.ceil(Math.pow(trafficIntensity, 2) / (stations * (1 - (trafficIntensity/stations))))
  };
};