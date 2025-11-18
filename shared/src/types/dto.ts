// src/types.ts
// This file contains the DTO (Data Transfer Object) and Command Model definitions
// for the Wardrobe Assistant Application API.
// They are derived and mapped from the underlying database models defined in database.ts
// and are used to enforce type-safety and consistency in the API layer.

import type { Database } from './database'

// Convenience types to extract Row types from the database schema tables.
type ProfilesRow = Database['public']['Tables']['profiles']['Row']
type WardrobeItemsRow = Database['public']['Tables']['wardrobe_items']['Row']
type ItemCategoriesRow = Database['public']['Tables']['item_categories']['Row']
type StylesRow = Database['public']['Tables']['styles']['Row']
type CreationsRow = Database['public']['Tables']['creations']['Row']
type CreationItemsRow = Database['public']['Tables']['creation_items']['Row']

/* ------------------------- DTO Definitions ------------------------- */

// 1. Profile DTO representing the public profile data.
export type ProfileDTO = Pick<ProfilesRow, 'id' | 'username' | 'created_at' | 'updated_at'>

// 2. Wardrobe Item DTO representing a user's wardrobe item.
export type WardrobeItemDTO = Pick<
  WardrobeItemsRow,
  'id' | 'category_id' | 'name' | 'color' | 'brand' | 'created_at' | 'updated_at' | 'user_id'
>

// 3. Item Category DTO representing a category entry.
export type ItemCategoryDTO = Pick<ItemCategoriesRow, 'id' | 'name' | 'display_name' | 'is_required'>

// 4. Style DTO representing a creation style.
export type StyleDTO = Pick<StylesRow, 'id' | 'name' | 'display_name'>

// 5. Creation DTO representing a saved creation.
export type CreationDTO = Pick<
  CreationsRow,
  'id' | 'name' | 'image_path' | 'style_id' | 'status' | 'created_at' | 'updated_at' | 'user_id'
>

// 6. Creation Item DTO representing the join table entry linking a creation to a wardrobe item.
export type CreationItemDTO = Pick<CreationItemsRow, 'id' | 'creation_id' | 'item_id'>

/* ------------------------- Command Model Definitions ------------------------- */

// 7. Register User Command - for user registration.
// This command includes the essential fields for creating a new user,
// and additional metadata (like username) for profile creation.
export type RegisterUserCommand = {
  email: string
  password: string
  additional_metadata?: {
    username?: string
  }
}

// 8. Login User Command - credentials for user login.
export type LoginUserCommand = {
  email: string
  password: string
}

// 9. Create Wardrobe Item Command - payload for creating a new wardrobe item.
// Inherits required fields from WardrobeItemDTO, excluding auto-generated ones.
export type CreateWardrobeItemCommand = Omit<WardrobeItemDTO, 'id' | 'created_at' | 'updated_at' | 'user_id'>

// 10. Update Profile Command - payload for updating user profile.
// Allows partial update of the ProfileDTO.
export type UpdateProfileCommand = Partial<Omit<ProfileDTO, 'id' | 'created_at' | 'updated_at'>>

// 11. Create Creation Command - payload for manually creating a new creation.
// Inherits required fields from CreationDTO, excluding auto-generated fields.
export type CreateCreationCommand = Omit<CreationDTO, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'status'>

// 12. Generate Creations Command - for AI-based generation of creations.
// Only requires a style_id as input.
export type GenerateCreationsCommand = {
  style_id: string
}

// 13. Add Wardrobe Item to Creation Command - payload to associate a wardrobe item with a creation.
export type AddWardrobeItemToCreationCommand = {
  item_id: string
}

// 14. Accept Creation Command - command to accept a generated creation.
// Typically the creation_id will be passed in the URL path, so this command can be empty.
// Provided here for consistency, it can be extended if additional payload is needed in future.
export type AcceptCreationCommand = Record<string, never>

// End of DTO and Command Model definitions.
