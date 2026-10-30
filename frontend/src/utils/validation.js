import { z } from 'zod'

const password = z
  .string()
  .min(8, 'Use at least 8 characters')
  .max(128, 'Password is too long')
  .refine((value) => /[A-Za-z]/.test(value) && /\d/.test(value), {
    message: 'Include at least one letter and one number',
  })

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Enter your full name').max(120, 'Name is too long'),
    email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
    phone: z
      .string()
      .trim()
      .regex(/^[0-9+\-\s()]{7,20}$/, 'Enter a valid phone number')
      .optional()
      .or(z.literal('')),
    password,
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  })

export const parcelSchema = z.object({
  receiver_email: z.string().min(1, 'Receiver email is required').email('Enter a valid email'),
  weight: z.coerce
    .number({ invalid_type_error: 'Enter the parcel weight' })
    .positive('Weight must be greater than zero')
    .max(1000, 'Maximum weight is 1000 kg'),
  pickup_address: z
    .string()
    .trim()
    .min(5, 'Enter the full pickup address')
    .max(255, 'Address is too long'),
  delivery_address: z
    .string()
    .trim()
    .min(5, 'Enter the full delivery address')
    .max(255, 'Address is too long'),
  estimated_delivery: z.string().optional().or(z.literal('')),
  notes: z.string().max(300, 'Keep notes under 300 characters').optional().or(z.literal('')),
})

export const statusUpdateSchema = z.object({
  status: z.enum([
    'CREATED',
    'PICKED_UP',
    'IN_TRANSIT',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'FAILED',
    'CANCELLED',
  ]),
  location: z.string().trim().min(2, 'Where is the parcel now?').max(255, 'Location is too long'),
  remarks: z.string().max(500, 'Keep remarks under 500 characters').optional().or(z.literal('')),
})

export const userCreateSchema = z.object({
  name: z.string().trim().min(2, 'Enter a name').max(120, 'Name is too long'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]{7,20}$/, 'Enter a valid phone number')
    .optional()
    .or(z.literal('')),
  role: z.enum(['admin', 'driver', 'customer']),
  password,
})

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, 'Enter your current password'),
    new_password: password,
    confirm_password: z.string().min(1, 'Confirm the new password'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    path: ['confirm_password'],
    message: 'Passwords do not match',
  })
