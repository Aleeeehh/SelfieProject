// import { Request, Response, Router } from "express";
// import mongoose from "mongoose";
// import { ResponseBody } from "../types/ResponseBody.js";
// import { ResponseStatus } from "../types/ResponseStatus.js";
import { Router } from "express";
import RisorsaSchema from "../schemas/Risorsa.js";

const router: Router = Router();

// Route per ottenere la risorsa
router.get("/", async (req, res) => {
    const { name } = req.query; // Prendi il parametro 'name' dalla query

    try {
        const risorsa = await RisorsaSchema.find({ name }); // Usa il parametro 'name' per la ricerca
        res.json({ "Risorsa aggiunta al database": risorsa });
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

export default router;
