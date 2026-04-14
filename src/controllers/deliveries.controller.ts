import { Request, Response } from "express";
import { db } from "../db";
import { deliveries } from "../db/schema";
import { eq } from "drizzle-orm";
import { eventQueue } from "../queues/eventQueue";

export const retryDelivery = async (req: Request, res: Response) => {
  const deliveryId = Number(req.params.id);

  const result = await db
    .select()
    .from(deliveries)
    .where(eq(deliveries.id, deliveryId));

  const delivery = result[0];

  if (!delivery) {
    return res.status(404).json({ message: "Delivery not found" });
  }

  await eventQueue.add(
    "deliver-event",
    { deliveryId },
    {
      attempts: 5,
      backoff: {
        type: "exponential",
        delay: 5000,
      },
    },
  );

  return res.json({
    message: "Delivery retry queued",
    deliveryId,
  });
};
