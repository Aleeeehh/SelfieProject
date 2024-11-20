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
    const startDateDate = new Date(startTime);
    const endDateDate = new Date(endTime)

    console.log("nome risorsa:", risorsa);
    console.log("nome risorsa:", risorsa);

    console.log("nome risorsa:", risorsa);

    console.log("nome risorsa:", risorsa);


    const eventiRisorsaAllocati = await EventSchema.find({ //trova eventi in cui è convolta la risorsa
        title: risorsa + " occupata", isRisorsa: true
    });

    console.log("eventiRisorsaAllocati trovati", eventiRisorsaAllocati);
    //filtra con un for, per ogni evento trovato, se l'orario coincide con l'orario di inizio o di fine dell'evento
    for (const evento of eventiRisorsaAllocati) {
        if (startDateDate < evento.endTime && endDateDate > evento.startTime) {
            console.log("TROVATO EVENTO CHE UTILIZZA GIA LA RISORSA NELLO STESSO PERIODO");
            console.log("TROVATO EVENTO CHE UTILIZZA GIA LA RISORSA NELLO STESSO PERIODO");
            console.log("TROVATO EVENTO CHE UTILIZZA GIA LA RISORSA NELLO STESSO PERIODO");
            console.log("TROVATO EVENTO CHE UTILIZZA GIA LA RISORSA NELLO STESSO PERIODO");
            console.log("TROVATO EVENTO CHE UTILIZZA GIA LA RISORSA NELLO STESSO PERIODO");
            console.log("TROVATO EVENTO CHE UTILIZZA GIA LA RISORSA NELLO STESSO PERIODO");
            isAvailable = false;
            return res.json({ isAvailable });
        }
    }

    res.json({ isAvailable });
});

export default router;
