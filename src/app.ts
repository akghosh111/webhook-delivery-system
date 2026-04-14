import express from "express";
import { createEvent } from "./controllers/events.controller";



export function createApplication() {
    const app = express()


    // Middlewares
    app.use(express.json())




    // Routes
    app.get("/", (req, res) => {
        return res.json({message: "Welcome to ChaiCode Auth Service"})
    })

    app.post("/events", createEvent)


    return app;
}