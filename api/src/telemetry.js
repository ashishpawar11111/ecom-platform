import { trace } from "@opentelemetry/api";

export const tracer = trace.getTracer("ecom-api");

export function telemetryMiddleware(req, res, next) {
  const span = tracer.startSpan(`${req.method} ${req.path}`);
  res.on("finish", () => {
    span.setAttribute("http.status_code", res.statusCode);
    span.end();
  });
  next();
}
