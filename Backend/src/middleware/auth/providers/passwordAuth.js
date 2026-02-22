import bcrypt from "bcrypt"

const saltRounds = 13;

export const hashPassword  = async (password) =>{
 return bcrypt.hash(password, saltRounds);
}

export const comparePassword  = async (password,hashed) =>{
    return bcrypt.compare(password, hashed);
}