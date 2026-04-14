import { Request, Response } from "express";
import { db } from "../db";
import { events, endpoints, deliveries } from "../db/schema";
import { eventQueue } from "../queues/eventQueue";

type CreateEventBody = {
  type: string;
  payload: unknown;
};

export const createEvent = async (
  req: Request<{}, {}, CreateEventBody>,
  res: Response
) => {
  try {
    const { type, payload } = req.body;

    if (!type || !payload) {
      return res.status(400).json({
        message: "type and payload are required"
      });
    }

    
    const eventResult = await db
      .insert(events)
      .values({ type, payload })
      .returning();

    const event = eventResult[0];

    if (!event) {
      return res.status(500).json({
        message: "Failed to create event"
      });
    }

    
    const allEndpoints = await db.select().from(endpoints);

    
    for (const endpoint of allEndpoints) {
      const deliveryResult = await db
        .insert(deliveries)
        .values({
          eventId: event.id,
          endpointId: endpoint.id
        })
        .returning();

      const delivery = deliveryResult[0];

      if (!delivery) continue;

      
      await eventQueue.add("deliver-event", {
        deliveryId: delivery.id
      });
    }

    return res.status(201).json({
      message: "Event created",
      eventId: event.id
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};