// import { Request, Response, Router } from "express";
// import mongoose from "mongoose";
// import { ResponseBody } from "../types/ResponseBody.js";
// import { ResponseStatus } from "../types/ResponseStatus.js";
import { Router } from "express";
import RisorsaSchema from "../schemas/Risorsa.js";
import EventSchema from "../schemas/Event.js";
const router: Router = Router();

// Route per ottenere la risorsa
router.get("/", async (req, res) => {
    const { name } = req.query; // Prendi il parametro 'name' dalla query

    try {
        const risorse = await RisorsaSchema.find({ name }); // Usa il parametro 'name' per la ricerca
        console.log("Risorse trovate:", risorse);
        res.json({ risorse });
    } catch (error) {
        res.status(500).json({ message: "error" });
    }
});

router.post("/", async (req, res) => {
    const { name, description } = req.body;
    const risorsa = await RisorsaSchema.create({ name, description });
    console.log("Risorsa aggiunta al database:", risorsa);
    await risorsa.save();
    res.json({ "Risorsa aggiunta al database": risorsa });
});

router.post("/checkResourceAvailability", async (req, res) => {
    console.log("Controllo disponibilità risorsa");
    console.log("Controllo disponibilità risorsa");
    console.log("Controllo disponibilità risorsa");
    console.log("Controllo disponibilità risorsa");
    console.log("Controllo disponibilità risorsa");
    const { risorsa, startTime, endTime } = req.body;
    //    const startDateValue = new Date(startTime);
    //    const endDateValue = new Date(endTime);
    let isAvailable = true;

    const eventiRisorsaAllocati = await EventSchema.find({ //trova eventi in cui è convolta la risorsa
        name: risorsa + " occupata", isRisorsa: true
    });
    //filtra con un for, per ogni evento trovato, se l'orario coincide con l'orario di inizio o di fine dell'evento

    console.log("Eventi con la risorsa allocata:", eventiRisorsaAllocati);


    if (eventiRisorsaAllocati.length > 0) {
        isAvailable = false;
    }

    res.json({ isAvailable });
});

export default router;
