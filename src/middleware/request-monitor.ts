import {
  Request,
  Response,
  NextFunction,
} from "express";

export let totalRequests = 0;

export let failedRequests = 0;

export let totalLatency = 0;

/* =========================================
   REQUEST MONITOR
========================================= */

export function requestMonitor(
  req: Request,
  res: Response,
  next: NextFunction
) {

  const start =
    Date.now();

  totalRequests++;

  res.on("finish", () => {

    const duration =
      Date.now() - start;

    totalLatency += duration;

    if (res.statusCode >= 400) {
      failedRequests++;
    }

  });

  next();
}

/* =========================================
   RESET EVERY MINUTE
========================================= */

export function resetRequestMetrics() {

  totalRequests = 0;

  failedRequests = 0;

  totalLatency = 0;
}