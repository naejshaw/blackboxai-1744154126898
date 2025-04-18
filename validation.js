const Joi = require('joi');

// Register validation
const registerValidation = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(3).required(),
    email: Joi.string().min(6).required().email(),
    phone: Joi.string().min(10).required(),
    password: Joi.string().min(6).required(),
    userType: Joi.string().valid('client', 'professional').required()
  });
  return schema.validate(data);
};

// Login validation
const loginValidation = (data) => {
  const schema = Joi.object({
    email: Joi.string().min(6).required().email(),
    password: Joi.string().min(6).required()
  });
  return schema.validate(data);
};

module.exports = {
  registerValidation,
  loginValidation
};
