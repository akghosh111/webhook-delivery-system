import { Request, Response } from "express";
import { db } from "../db";
import { events, endpoints, deliveries } from "../db/schema";
import { eventQueue } from "../queues/eventQueue";
import { eq } from "drizzle-orm";

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

      
      await eventQueue.add(
            "deliver-event",
            { deliveryId: delivery.id },
            {
                attempts: 5,
                backoff: {
                type: "exponential",
                delay: 5000
                }
            }
        );
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


export const getEvents = async (req: Request, res: Response) => {
  const result = await db.select().from(events);

  res.json(result);
};


export const getEventById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  const result = await db
    .select()
    .from(events)
    .where(eq(events.id, id));

  const event = result[0];

  if (!event) {
    return res.status(404).json({ message: "Event not found" });
  }

  res.json(event);
};


export const getEndpoints = async (req: Request, res: Response) => {
  const result = await db.select().from(endpoints);

  res.json(result);
};
