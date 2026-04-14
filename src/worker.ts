import { Worker } from "bullmq";
import { redis } from "./config/redis";
import { db } from "./db";
import { deliveries, events, endpoints } from "./db/schema";
import { eq } from "drizzle-orm";
import axios from "axios";

type JobPayload = {
  deliveryId: number;
};

export const worker = new Worker<JobPayload>(
  "event-delivery-queue",
  async (job) => {
    const { deliveryId } = job.data;

    console.log("Processing delivery:", deliveryId);

    
    const deliveryResult = await db
      .select()
      .from(deliveries)
      .where(eq(deliveries.id, deliveryId));

    const delivery = deliveryResult[0];
    if (!delivery) {
      console.log("Delivery not found");
      return;
    }

    
    const eventResult = await db
      .select()
      .from(events)
      .where(eq(events.id, delivery.eventId));

    const event = eventResult[0];
    if (!event) {
      console.log("Event not found");
      return;
    }

    
    const endpointResult = await db
      .select()
      .from(endpoints)
      .where(eq(endpoints.id, delivery.endpointId));

    const endpoint = endpointResult[0];
    if (!endpoint) {
      console.log("Endpoint not found");
      return;
    }

    
    const response = await axios.post(endpoint.url, {
      type: event.type,
      payload: event.payload
    });

    console.log("Webhook sent:", response.status);
  },
  {
    connection: redis
  }
);