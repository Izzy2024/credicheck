import { z } from 'zod';

export const updateSettingsSchema = z.object({
  configs: z
    .array(
      z.object({
        key: z.string().min(1),
        value: z.string(),
      })
    )
    .min(1),
});
