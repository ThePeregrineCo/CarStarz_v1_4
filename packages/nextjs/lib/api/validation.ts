/**
 * API Validation Utilities
 * 
 * This file provides utilities for validating API inputs using Zod.
 * It ensures that all inputs to API endpoints are properly validated.
 */

import { z } from 'zod';
import { ValidationError } from '../../core/errors';

/**
 * Vehicle profile validation schema
 */
export const vehicleProfileSchema = z.object({
  tokenId: z.string().min(1, "Token ID is required"),
  vin: z.string().length(17, "VIN must be exactly 17 characters"),
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z.number().int().min(1900, "Year must be at least 1900").max(new Date().getFullYear() + 1, `Year cannot be in the future`),
  name: z.string().optional(),
  description: z.string().optional(),
  ownerWallet: z.string().min(1, "Owner wallet address is required"),
  primaryImageUrl: z.string().url("Primary image URL must be a valid URL").optional(),
});

/**
 * Vehicle update validation schema
 */
export const vehicleUpdateSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  primaryImageUrl: z.string().url("Primary image URL must be a valid URL").optional(),
});

/**
 * Vehicle media validation schema
 */
export const vehicleMediaSchema = z.object({
  caption: z.string().optional(),
  category: z.string().optional(),
  isFeatured: z.boolean().optional(),
});

/**
 * Vehicle specification validation schema
 */
export const vehicleSpecificationSchema = z.object({
  category: z.string().min(1, "Category is required"),
  name: z.string().min(1, "Name is required"),
  value: z.string().min(1, "Value is required"),
});

/**
 * Vehicle link validation schema
 */
export const vehicleLinkSchema = z.object({
  title: z.string().min(1, "Title is required"),
  url: z.string().url("URL must be a valid URL"),
  type: z.string().min(1, "Type is required"),
  icon: z.string().optional(),
});

/**
 * Vehicle modification validation schema
 */
export const vehicleModificationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  imageUrl: z.string().url("Image URL must be a valid URL").optional(),
  linkUrl: z.string().url("Link URL must be a valid URL").optional(),
});

/**
 * Vehicle comment validation schema
 */
export const vehicleCommentSchema = z.object({
  userWallet: z.string().min(1, "User wallet address is required"),
  content: z.string().min(1, "Content is required"),
});

/**
 * Vehicle video validation schema
 */
export const vehicleVideoSchema = z.object({
  title: z.string().min(1, "Title is required"),
  youtubeUrl: z.string().url("YouTube URL must be a valid URL"),
  description: z.string().optional(),
});

/**
 * User validation schema
 */
export const userSchema = z.object({
  walletAddress: z.string().min(1, "Wallet address is required"),
  username: z.string().min(3, "Username must be at least 3 characters").optional(),
  displayName: z.string().optional(),
  profileImage: z.string().url("Profile image URL must be a valid URL").optional(),
});

/**
 * User update validation schema
 */
export const userUpdateSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").optional(),
  displayName: z.string().optional(),
  profileImage: z.string().url("Profile image URL must be a valid URL").optional(),
});

/**
 * Social link validation schema
 */
export const socialLinkSchema = z.object({
  platform: z.string().min(1, "Platform is required"),
  url: z.string().url("URL must be a valid URL"),
  displayName: z.string().optional(),
});

/**
 * Validate request body against a schema
 * 
 * @param body The request body to validate
 * @param schema The Zod schema to validate against
 * @returns The validated data
 * @throws ValidationError if validation fails
 */
export async function validateBody<T>(body: any, schema: z.ZodType<T>): Promise<T> {
  try {
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Validation failed', error.format());
    }
    throw error;
  }
}

/**
 * Validate request body from a Request object
 * 
 * @param request The Request object
 * @param schema The Zod schema to validate against
 * @returns The validated data
 * @throws ValidationError if validation fails
 */
export async function validateRequest<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  try {
    const body = await request.json();
    return await validateBody(body, schema);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new ValidationError('Invalid JSON in request body');
    }
    throw error;
  }
}

// Export types derived from schemas
export type VehicleProfileInput = z.infer<typeof vehicleProfileSchema>;
export type VehicleUpdateInput = z.infer<typeof vehicleUpdateSchema>;
export type VehicleMediaInput = z.infer<typeof vehicleMediaSchema>;
export type VehicleSpecificationInput = z.infer<typeof vehicleSpecificationSchema>;
export type VehicleLinkInput = z.infer<typeof vehicleLinkSchema>;
export type VehicleModificationInput = z.infer<typeof vehicleModificationSchema>;
export type VehicleCommentInput = z.infer<typeof vehicleCommentSchema>;
export type VehicleVideoInput = z.infer<typeof vehicleVideoSchema>;
export type UserInput = z.infer<typeof userSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
export type SocialLinkInput = z.infer<typeof socialLinkSchema>;