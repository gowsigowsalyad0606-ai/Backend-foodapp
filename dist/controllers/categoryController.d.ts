import { Request, Response } from 'express';
export declare const createCategory: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getCategories: (req: Request, res: Response) => Promise<void>;
export declare const getCategory: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateCategory: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteCategory: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const toggleCategoryStatus: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const bulkCreateCategories: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getRestaurantCategories: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=categoryController.d.ts.map