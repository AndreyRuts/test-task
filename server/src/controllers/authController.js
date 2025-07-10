import {
    registerUser,
    loginUser
 } from "../services/auth.js";

export const registerController = async (req, reply) => {
    const user = await registerUser(req.body);

    reply.status(201).send({
        status: 201,
        message: 'Successfully registered a user!',
        data: user,
    });
}

export const loginController = async (req, reply) => {
    const result = await loginUser(req.body);
  
    reply.code(200).send({
      status: 200,
      message: 'Login successful',
      data: result
    });
  };
  
  export const getCurrentUser = async (req, reply) => {
    reply.send({
      status: 200,
      data: req.user
    });
  };