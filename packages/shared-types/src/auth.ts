import { z } from "zod";
import { orgRoleSchema } from "./roles";

export const emailSchema = z
  .string()
  .trim()
  .min(3)
  .max(254)
  .email("Enter a valid email address")
  .transform((value) => value.toLowerCase());

export const passwordSchema = z
  .string()
  .min(10, "Password must be at least 10 characters")
  .max(128, "Password must be at most 128 characters");

export const displayNameSchema = z.string().trim().min(1, "Name is required").max(120);

export const currencyCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/, "Currency must be a 3-letter ISO code");

export const timezoneSchema = z.string().trim().min(1).max(64);

/** Sign up creates the user AND their first organization (owner). */
export const signupSchema = z.object({
  name: displayNameSchema,
  email: emailSchema,
  password: passwordSchema,
  organizationName: z.string().trim().min(1, "Organization name is required").max(160),
  timezone: timezoneSchema.default("Asia/Kolkata"),
  defaultCurrency: currencyCodeSchema.default("INR"),
});
export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required").max(128),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const updateOrganizationSchema = z
  .object({
    name: z.string().trim().min(1).max(160),
    timezone: timezoneSchema,
    defaultCurrency: currencyCodeSchema,
  })
  .partial();
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;

export const inviteMemberSchema = z.object({
  email: emailSchema,
  role: orgRoleSchema,
});
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

export const updateMemberSchema = z
  .object({
    role: orgRoleSchema,
    status: z.enum(["ACTIVE", "DEACTIVATED"]),
  })
  .partial();
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;

export const acceptInvitationSchema = z.object({
  token: z.string().trim().min(20, "Invalid invitation token").max(200),
  name: displayNameSchema,
  password: passwordSchema,
});
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
