import { object, string, type TypeOf } from "zod";

export const signInSchema = object({
  phone: string({
    required_error: "phone is required",
  }),
  password: string({
    required_error: "password is required",
  }),
});

export const signUpSchema=object({
  email: string({
    required_error: "email is required",
  }).email({ message: "Invalid email address" }),
  password: string({
    required_error: "email is required",
  }),
  name: string(),
  
  phone: string({
    required_error: "phone no is required",
  })
})

export type SignInInput = TypeOf<typeof signInSchema>;
export type  SignUpSchema = TypeOf<typeof signUpSchema>;
