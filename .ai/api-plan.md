# REST API Plan

## Overview
This API plan is designed for the Wardrobe Assistant Application. It leverages Supabase as the backend platform providing auto-generated REST API endpoints through PostgREST, built-in authentication via Supabase Auth, and row-level security. Custom endpoints will be implemented where complex business logic is required (e.g., AI generation of wardrobe creations).

## 1. Resources
Based on the provided database schema, the main resources and their corresponding tables are:
- **Profiles**: Corresponds to `public.profiles`; contains public user profile data.
- **Item Categories**: Corresponds to `public.item_categories`; dictionary of wardrobe item categories.
- **Styles**: Corresponds to `public.styles`; dictionary of creation styles.
- **Wardrobe Items**: Corresponds to `public.wardrobe_items`; user-owned clothing items.
- **Creations**: Corresponds to `public.creations`; saved outfit creations.
- **Creation Items**: Corresponds to `public.creation_items`; join table linking creations to wardrobe items.
- **Authentication**: Managed via `auth.users` and Supabase Auth.

## 2. Endpoints
For each resource, the following endpoints are planned:

### 2.1. Authentication Endpoints
- **Register User**
    - **Method:** POST
    - **Path:** `/auth/v1/signup`
    - **Description:** Create a new user account with email and password. Triggers automatic profile creation.
    - **Request Payload:**
      ```json
      {
        "email": "string",
        "password": "string",
        "additional_metadata": { "username": "string" }
      }
      ```
    - **Success Response:** HTTP 201 with user details.
    - **Error Responses:** Validation errors or HTTP 400 for invalid input.

- **Login User**
    - **Method:** POST
    - **Path:** `/auth/v1/login`
    - **Description:** Authenticate a user with email and password.
    - **Request Payload:**
      ```json
      {
        "email": "string",
        "password": "string"
      }
      ```
    - **Success Response:** HTTP 200 with JWT token and user profile.
    - **Error Responses:** HTTP 401 for invalid credentials.

### 2.2. Profiles Endpoints
- **Get User Profile**
    - **Method:** GET
    - **Path:** `/profiles/{user_id}`
    - **Description:** Retrieve the public profile of a user.
    - **Success Response:**
      ```json
      {
        "id": "uuid",
        "username": "string",
        "created_at": "timestamp",
        "updated_at": "timestamp"
      }
      ```
    - **Security:** Uses RLS; user can only access their own profile unless an admin.

- **Update Profile**
    - **Method:** PUT/PATCH
    - **Path:** `/profiles/{user_id}`
    - **Description:** Update public profile information.
    - **Request Payload:** Fields such as `username`.
    - **Success Response:** HTTP 200 with updated profile.
    - **Error Responses:** HTTP 403 if trying to update another user’s profile.

### 2.3. Item Categories & Styles Endpoints
- **List Categories or Styles**
    - **Method:** GET
    - **Path:** `/item_categories` or `/styles`
    - **Description:** Retrieve all available item categories or styles.
    - **Success Response:** List of categories/styles.
    - **Security:** Readable by all authenticated users.

- **(Admin Only) Create/Update Categories or Styles**
    - **Method:** POST/PUT
    - **Path:** `/admin/item_categories` or `/admin/styles`
    - **Description:** Endpoints for administrators to manage dictionaries.
    - **Security:** Restricted to users with service_role.

### 2.4. Wardrobe Items Endpoints
- **List Wardrobe Items**
    - **Method:** GET
    - **Path:** `/wardrobe_items`
    - **Description:** Retrieve a list of wardrobe items belonging to the authenticated user.
    - **Query Parameters:** Supports pagination, filtering (by category, color, brand), and sorting (by created_at).
    - **Success Response:** Array of wardrobe items.
    - **Error Responses:** HTTP 401 if unauthenticated.

- **Create Wardrobe Item**
    - **Method:** POST
    - **Path:** `/wardrobe_items`
    - **Description:** Add a new wardrobe item for the authenticated user.
    - **Request Payload:**
      ```json
      {
        "category_id": "uuid",
        "name": "string",
        "color": "string",
        "brand": "string (optional)"
      }
      ```
    - **Success Response:** HTTP 201 with the created item.
    - **Validation:** Must include required fields as per schema (e.g., category is required if defined as such).

- **Update Wardrobe Item**
    - **Method:** PATCH
    - **Path:** `/wardrobe_items/{item_id}`
    - **Description:** Update details of a wardrobe item.
    - **Success Response:** HTTP 200 with updated data.

- **Delete Wardrobe Item**
    - **Method:** DELETE
    - **Path:** `/wardrobe_items/{item_id}`
    - **Description:** Delete an item from the user’s wardrobe.
    - **Success Response:** HTTP 204 on successful deletion.

### 2.5. Creations Endpoints
- **List Creations**
    - **Method:** GET
    - **Path:** `/creations`
    - **Description:** Retrieve a list of creations by the authenticated user.
    - **Query Parameters:** Pagination, filtering by date, style, etc.
    - **Success Response:** Array of creation objects.

- **Create Creation (Manual)**
    - **Method:** POST
    - **Path:** `/creations`
    - **Description:** Manually create a new creation record. This endpoint also accepts an image file path.
    - **Request Payload:**
      ```json
      {
        "style_id": "uuid",
        "name": "string",
        "image_path": "string"
      }
      ```
    - **Success Response:** HTTP 201 with creation details.

- **Generate Creations via AI**
    - **Method:** POST
    - **Path:** `/creations/generate`
    - **Description:** Trigger AI process to generate outfit suggestions. This endpoint verifies the presence of minimal required wardrobe items (e.g., top, bottom, shoes) before generation.
    - **Request Payload:**
      ```json
      {
        "style_id": "uuid"
      }
      ```
    - **Alternative Designs Considered:**
        - Option 1: Single endpoint that validates input and returns suggestions if all required categories are present.
        - Option 2: Two endpoints: one to validate wardrobe composition and another to generate creations.
    - **Chosen Design:** Option 1 was selected for simplicity and atomicity – the endpoint first validates and then triggers the AI generation. It returns an error if required wardrobe items are missing.
    - **Success Response:**
      ```json
      {
        "suggestions": [
          {
            "creation": { "id": "uuid", "name": "string", "image_path": "string", "style": "string" },
            "description": "Details about the outfit composition"
          },
          ...
        ]
      }
      ```
    - **Error Responses:** HTTP 400 with a message if required items are missing.

- **Accept Creation**
    - **Method:** POST
    - **Path:** `/creations/{creation_id}/accept`
    - **Description:** Accept a generated creation, moving it to the user’s saved creations collection.
    - **Success Response:** HTTP 200 with confirmation.
    - **Error Responses:** HTTP 400 if the creation is invalid or not found.

### 2.6. Creation Items Endpoints
- **List Creation Items for a Creation**
    - **Method:** GET
    - **Path:** `/creations/{creation_id}/items`
    - **Description:** Retrieve all wardrobe items associated with a specific creation.
    - **Success Response:** Array of wardrobe items linked to the creation.
    - **Security:** Ensures only the creator can view items via RLS.

- **Add Wardrobe Item to a Creation**
    - **Method:** POST
    - **Path:** `/creations/{creation_id}/items`
    - **Description:** Associate a wardrobe item with a creation. Underlying validation occurs per the `can_add_to_creation` function.
    - **Request Payload:**
      ```json
      {
        "item_id": "uuid"
      }
      ```
    - **Success Response:** HTTP 201 with association details.
    - **Error Responses:** HTTP 403 if the wardrobe item does not belong to the user.

## 3. Authentication and Authorization
- **Mechanism:** Supabase authentication is used to manage user sessions and issue JWT tokens.
- **Access Control:** Row-Level Security (RLS) is implemented on all user-specific tables (profiles, wardrobe_items, creations, and creation_items). Each endpoint validates that the requesting user's ID matches the resource owner.
- **Admin Actions:** Certain endpoints (e.g., managing categories and styles) are restricted to administrators (service_role) only.
- **Token Handling:** All secured endpoints require a valid JWT token in the request header.

## 4. Validation and Business Logic
- **Input Validation:**
    - User registration and login are validated for correct email format, password presence, and confirmation.
    - Wardrobe item creation requires valid category selection, and required fields such as name and color.
- **Business Logic Mapping:**
    - The AI creation generation endpoint enforces business rules by checking for the presence of required items (at least top, bottom, and shoes) as specified in the PRD.
    - The `can_add_to_creation` function is utilized to ensure that only wardrobe items owned by the user can be added to a creation.
- **Pagination, Filtering, and Sorting:** List endpoints support optional query parameters to handle pagination and filtering (e.g., by creation date or category). This supports performance improvements and better UX.
- **Error Handling:**
    - Detailed error messages are returned (e.g., missing wardrobe items for AI generation, unauthorized access) with appropriate HTTP status codes.
- **Database Constraints Integration:**
    - The API design respects the database schema constraints (unique usernames, non-null fields, and foreign key relations).
    - Triggers that update the `updated_at` field are presumed to operate automatically upon updates.

## Assumptions
- All endpoints assume that the client correctly handles authentication tokens.
- The API is designed as a combination of auto-generated Supabase endpoints and custom endpoints for complex business logic (AI generation).
- AI integration is assumed to be handled by a separate service (e.g., Openrouter.ai) that the API communicates with asynchronously.

This comprehensive plan outlines how each resource, endpoint, and security measure is modeled to ensure a robust, secure, and scalable Wardrobe Assistant API.
