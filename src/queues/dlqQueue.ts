import { Queue } from "bullmq";
import { redis } from "../config/redis";

export const dlqQueue = new Queue("webhook-dlq", {
  connection: redis
});