import {z} from 'zod';

function isObjectId(invalidMessage?: string) {
  return z.string().min(1, invalidMessage || 'Invalid ID');
}

function toObjectId(invalidMessage?: string) {
  return z.string().min(1, invalidMessage || 'Invalid ID');
}

function mmddyyyy(invalidMessage?: string) {
  return z
    .string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, invalidMessage || 'Invalid date format. Must be MM/DD/YYYY');
}

function escapedQuery(invalidMessage?: string) {
  return z.string().transform((val) => val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
}

function emailAddress(invalidMessage?: string) {
  return z
    .string()
    .trim()
    .email(invalidMessage || 'Please provide a valid email address.');
}

export const zu = {
  isObjectId,
  toObjectId,
  mmddyyyy,
  escapedQuery,
  emailAddress,
};
