import createHttpError from 'http-errors';

import { verifyToken } from '../utils/jwt.js';
import { User } from '../models/User.js';

export const auth = async (req, reply) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) throw new createHttpError.Unauthorized('Missing token');

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) throw new createHttpError.Unauthorized('User not found');

    req.user = user;
  } catch (err) {
    throw new createHttpError.Unauthorized('Invalid token');
  }
};