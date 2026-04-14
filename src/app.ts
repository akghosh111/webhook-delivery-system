import express from "express";
import { createEvent } from "./controllers/events.controller";

import { retryDelivery } from "./controllers/deliveries.controller";

export function createApplication() {
  const app = express();

  // Middlewares
  app.use(express.json());

  // Routes

  app.post("/events", createEvent);

  app.post("/deliveries/:id/retry", retryDelivery);

  return app;
}
