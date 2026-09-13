import{z}from"zod";
export const guardianLinkSchema=z.object({studentId:z.string().trim().min(1),guardianUserId:z.string().trim().min(1),relationship:z.string().trim().min(2).max(50),isPrimary:z.boolean().optional().default(false)});
export const profileUpdateSchema=z.object({firstName:z.string().trim().min(1).max(80),lastName:z.string().trim().min(1).max(80),phone:z.union([z.literal(""),z.string().trim().min(7).max(30)]).optional().default("")});
export const passwordChangeSchema=z.object({currentPassword:z.string().min(1).max(200),newPassword:z.string().min(12).max(200)}).refine(value=>value.currentPassword!==value.newPassword,{message:"New password must be different",path:["newPassword"]});
