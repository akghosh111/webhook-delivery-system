import { Worker } from "bullmq";
import { redis } from "./config/redis";

new Worker(
  "webhook-dlq",
  async (job) => {
    console.error("DLQ job detected:", job.data);
  },
  {
    connection: redis
  }
);