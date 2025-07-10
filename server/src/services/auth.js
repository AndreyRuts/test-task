import bcrypt from 'bcrypt';
import createHttpError from 'http-errors';

import { User } from '../models/User.js';
import { generateToken } from '../utils/jwt.js';

export const registerUser = async (payload) => {
    const user = await User.findOne({ email: payload.email });

    if (user) {
        throw new createHttpError.Conflict('Email in use');
    }
    payload.password = await bcrypt.hash(payload.password, 10);
    return User.create(payload);
};

export const loginUser = async ({ email, password }) => {
    const user = await User.findOne({ email });
    if (!user) throw new createHttpError.Unauthorized('Invalid credentials');
  
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new createHttpError.Unauthorized('Invalid credentials');
  
    const token = generateToken({ id: user._id });
  
    return { token };
  };