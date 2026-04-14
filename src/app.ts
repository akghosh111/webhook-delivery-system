import express from "express";
import { createEvent, getEndpoints, getEventById, getEvents } from "./controllers/events.controller";

import { getDeliveries, getDeliveryById, retryDelivery } from "./controllers/deliveries.controller";

export function createApplication() {
  const app = express();

  // Middlewares
  app.use(express.json());

  // Routes

  app.post("/events", createEvent);

  app.post("/deliveries/:id/retry", retryDelivery);

  app.get("/events", getEvents);

  app.get("/events/:id", getEventById);

  app.get("/deliveries", getDeliveries);

  app.get("/deliveries/:id", getDeliveryById);

  app.get("/endpoints", getEndpoints);

  return app;
}
