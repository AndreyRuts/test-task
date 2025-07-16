import {
    registerController,
    loginController,
    getCurrentUser
 } from "../controllers/authController.js";

import {
    registerSchema,
    loginSchema
 } from "../validation/authSchemas.js";

import { ctrlWrapper } from "../utils/ctrlWrapper.js";
import { validateBody } from "../middlewares/validateBody.js";
import { auth } from "../middlewares/auth.js";

export default async function authRoutes(app, opts) {
    app.post(
      '/register',
      {
        preHandler: validateBody(registerSchema),
      },
      ctrlWrapper(registerController)
    );

    app.post(
        '/login',
        { preHandler: validateBody(loginSchema) },
        ctrlWrapper(loginController)
    );
    
      app.get(
        '/me',
        { preHandler: auth },
        ctrlWrapper(getCurrentUser)
    );
}
    
  