// import { Request, Response, Router } from "express";
// import mongoose from "mongoose";
// import { ResponseBody } from "../types/ResponseBody.js";
// import { ResponseStatus } from "../types/ResponseStatus.js";
import { Router } from "express";
import CurrentDateSchema from "../schemas/currentDate.js";

const router: Router = Router();

// Route per ottenere la data corrente
router.get("/", async (_, res) => {
    try {
        const currentDate = await CurrentDateSchema.findOne(); // Trova il documento della data corrente
        res.json({ currentDate: currentDate?.date });
    } catch (error) {
        res.status(500).json({ message: "error" });
    }
});

// Route per aggiornare la data corrente
router.post("/", async (req, res) => {
    // console.log("ENTRO NELLA POST DI CURRENT DATE");
    const { newDate } = req.body;
    // console.log("Nuova data ricevuta:", newDate);

    try {
        const currentDate = await CurrentDateSchema.findOne(); // Trova il documento della data corrente
        if (currentDate) {
            // console.log("CURRENT DATE TROVATA, AGGIORNANDO...");
            currentDate.date = new Date(newDate); // Aggiorna la data
            try {
                await currentDate.save(); // Salva il documento
                // console.log("CURRENT DATE AGGIORNATA!");
            } catch (saveError) {
                console.error(
                    "Errore durante il salvataggio della data corrente:",
                    saveError
                );
            }
        } else {
            // console.log("CURRENT DATE NON TROVATA, CREANDO...");
            // Se non esiste, crea un nuovo documento
            const newCurrentDate = new CurrentDateSchema({
                date: new Date(newDate),
            });
            await newCurrentDate.save();
            // console.log("CURRENT DATE CREATA!");
        }
        res.json({ currentDate: newDate });
    } catch (error) {
        console.error("Errore durante la richiesta:", error);
        res.status(500).json({ message: "error" });
    }
});

export default router;
