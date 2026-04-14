import { Worker } from "bullmq";
import { redis } from "./config/redis";
import { db } from "./db";
import { deliveries, events, endpoints } from "./db/schema";
import { eq } from "drizzle-orm";
import axios from "axios";
import { generateSignature } from "./utils/signature";
import { dlqQueue } from "./queues/dlqQueue";

type JobPayload = {
  deliveryId: number;
};

console.log("Webhook worker started...");

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

    if (delivery.status === "SUCCESS") {
      console.log("Delivery already completed. Skipping.");
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

    try {
      await db
        .update(deliveries)
        .set({
          attemptCount: delivery.attemptCount + 1,
          lastAttemptAt: new Date(),
        })
        .where(eq(deliveries.id, delivery.id));

      const payload = {
        id: event.id,
        type: event.type,
        created_at: event.createdAt,
        data: event.payload,
      };

      const payloadString = JSON.stringify(payload);

      const signature = generateSignature(payloadString, endpoint.secret);

      const response = await axios.post(endpoint.url, payload, {
        headers: {
          "User-Agent": "Webhook-System/1.0",
          "X-Webhook-Signature": signature,
        },
        timeout: 5000,
      });

      console.log("Webhook sent successfully:", response.status);

      await db
        .update(deliveries)
        .set({
          status: "SUCCESS",
          responseCode: response.status,
          responseBody: JSON.stringify(response.data),
          updatedAt: new Date(),
        })
        .where(eq(deliveries.id, delivery.id));
    } catch (error: any) {
      console.error("Webhook delivery failed");

      const responseCode = error?.response?.status ?? null;
      const responseBody = error?.response?.data
        ? JSON.stringify(error.response.data)
        : error.message;

      await db
        .update(deliveries)
        .set({
          status: "FAILED",
          responseCode,
          responseBody,
          updatedAt: new Date(),
        })
        .where(eq(deliveries.id, delivery.id));

      await dlqQueue.add("failed-delivery", {
        deliveryId: delivery.id,
        endpointId: endpoint.id,
        eventId: event.id,
        error: responseBody,
      });
    }
  },
  {
    connection: redis,
  },
);
