/** CategoryResponseDto serialized over HTTP. */
export interface Category {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  productsCount?: number;
  createdAt: string;
}
export interface CreateCategoryInput { name: string; description?: string; active?: boolean }
export interface UpdateCategoryInput { name?: string; description?: string; active?: boolean }
export interface CategoryQuery { active?: boolean }
