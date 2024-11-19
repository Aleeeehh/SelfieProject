import mongoose from "mongoose";

const RisorsaSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false
    }
});

const Risorsa = mongoose.model('Risorsa', RisorsaSchema);

export default Risorsa;
