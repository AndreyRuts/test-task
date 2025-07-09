import mongoose from "mongoose";

// const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
      },
}, { timestamps: true }
);

// module.exports = mongoose.model('User', userSchema);
export const User = mongoose.model('Users', usersSchema);
