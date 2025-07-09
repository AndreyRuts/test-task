import Joi from "joi";

export const registerSchema = Joi.object({
    email: Joi.string().email().required(),
})
