import mongoose from "mongoose";

const CurrentDateSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        default: Date.now, // Imposta la data corrente come default
    },
});

const CurrentDate = mongoose.model('CurrentDate', CurrentDateSchema);

export default CurrentDate;
