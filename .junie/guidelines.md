# AI Rules for {{project-name}}

Produkt to mobilna aplikacja (React Native, Android) umożliwiająca zarządzanie garderobą użytkownika oraz generowanie inspirujących kreacji przy użyciu AI. Aplikacja pozwala użytkownikom na rejestrację/logowanie, dodawanie, edycję i usuwanie elementów garderoby (każdy oznaczony etykietą: okrycie głowy, okrycie górne, okrycie dolne, buty) oraz generowanie propozycji kreacji w oparciu o dostępne elementy i wybrany styl (np. casual, elegancki, plażowy, sexy). Generowane kreacje są wizualizowane w formacie PNG, a użytkownik może zaakceptować lub odrzucić propozycje, zapisując wybrane kreacje do kolekcji.

## Tech Stack

- Expo 54
- React 19
- TypeScript 5
- Tailwind 4
- NestJS 11
- PostgreSQL

## Project Structure

When introducing changes to the project, always follow the directory structure below:

- `./wardrobe-assistant-api` - root API workspace directory (NestJS)
- `./wardrobe-assistant-app` - root React Native App workspace directory
- `./wardrobe-assistant-app/app` - root Mobile (React Native) App directory / Tabs navigation base on folder structure
- `./wardrobe-assistant-app/assets` - static internal assets
- `./wardrobe-assistant-app/constants` - Mobile App global constants
- `./shared` - shared workspace directory (code between the API and the App)
- `./db` - database generated types
- `./supabase/migrations` - Supabase migrations
- `./types` - type definitions

When modifying the directory structure, always update this section.

## Coding practices

### Guidelines for clean code

- Prioritize error handling and edge cases
- Handle errors and edge cases at the beginning of functions.
- Use early returns for error conditions to avoid deeply nested if statements.
- Place the happy path last in the function for improved readability.
- Avoid unnecessary else statements; use if-return pattern instead.
- Use guard clauses to handle preconditions and invalid states early.
- Implement proper error logging and user-friendly error messages.
- Consider using custom error types or error factories for consistent error handling.

## FRONTEND

### Guidelines for REACT

#### REACT_CODING_STANDARDS

- Use functional components with hooks instead of class components
- Implement React.memo() for expensive components that render often with the same props
- Utilize React.lazy() and Suspense for code-splitting and performance optimization
- Use the useCallback hook for event handlers passed to child components to prevent unnecessary re-renders
- Prefer useMemo for expensive calculations to avoid recomputation on every render
- Implement useId() for generating unique IDs for accessibility attributes
- Use the new use hook for data fetching in React 19+ projects
- Leverage Server Components for {{data_fetching_heavy_components}} when using React with Next.js or similar frameworks
- Consider using the new useOptimistic hook for optimistic UI updates in forms
- Use useTransition for non-urgent state updates to keep the UI responsive

#### ZUSTAND

- Create separate stores for distinct state domains instead of one large store
- Use immer middleware for complex state updates to maintain immutability when dealing with nested data
- Implement selectors to derive state and prevent unnecessary re-renders
- Leverage the persist middleware for automatic state persistence in localStorage or other storage
- Use TypeScript with strict typing for store definitions to catch errors at compile time
- Prefer shallow equality checks with useShallow for performance optimization in component re-renders
- Combine stores using composition for sharing logic between stores
- Implement subscriptions to react to state changes outside of React components
- Use devtools middleware for Redux DevTools integration in development
- Create custom hooks to encapsulate store access and related business logic

#### REACT_QUERY

- Use TanStack Query (formerly React Query) with appropriate staleTime and gcTime based on data freshness requirements
- Implement the useInfiniteQuery hook for pagination and infinite scrolling
- Use optimistic updates for mutations to make the UI feel more responsive
- Leverage queryClient.setQueryDefaults to establish consistent settings for query categories
- Use suspense mode with <Suspense> boundaries for a more declarative data fetching approach
- Implement retry logic with custom backoff algorithms for transient network issues
- Use the select option to transform and extract specific data from query results
- Implement mutations with onMutate, onError, and onSettled for robust error handling
- Use Query Keys structuring pattern ([entity, params]) for better organization and automatic refetching
- Implement query invalidation strategies to keep data fresh after mutations


### Guidelines for STYLING

#### TAILWIND

- Use the @layer directive to organize styles into components, utilities, and base layers
- Implement Just-in-Time (JIT) mode for development efficiency and smaller CSS bundles
- Use arbitrary values with square brackets (e.g., w-[123px]) for precise one-off designs
- Leverage the @apply directive in component classes to reuse utility combinations
- Implement the Tailwind configuration file for customizing theme, plugins, and variants
- Use component extraction for repeated UI patterns instead of copying utility classes
- Leverage the theme() function in CSS for accessing Tailwind theme values
- Implement dark mode with the dark: variant
- Use responsive variants (sm:, md:, lg:, etc.) for adaptive designs
- Leverage state variants (hover:, focus:, active:, etc.) for interactive elements


### Guidelines for ACCESSIBILITY

#### MOBILE_ACCESSIBILITY

- Ensure touch targets are at least 44 by 44 pixels for comfortable interaction on mobile devices
- Implement proper viewport configuration to support pinch-to-zoom and prevent scaling issues
- Design layouts that adapt to both portrait and landscape orientations without loss of content
- Support both touch and keyboard navigation for hybrid devices with {{input_methods}}
- Ensure interactive elements have sufficient spacing to prevent accidental activation
- Test with mobile screen readers like VoiceOver (iOS) and TalkBack (Android)
- Design forms that work efficiently with on-screen keyboards and autocomplete functionality
- Implement alternatives to complex gestures that require fine motor control
- Ensure content is accessible when device orientation is locked for users with fixed devices
- Provide alternatives to motion-based interactions for users with vestibular disorders

## TESTING

### Guidelines for UNIT

#### JEST

- Use Jest with TypeScript for type checking in tests
- Implement Testing Library for component testing instead of enzyme
- Use snapshot testing sparingly and only for stable UI components
- Leverage mock functions and spies for isolating units of code
- Implement test setup and teardown with beforeEach and afterEach
- Use describe blocks for organizing related tests
- Leverage expect assertions with specific matchers
- Implement code coverage reporting with meaningful targets
- Use mockResolvedValue and mockRejectedValue for async testing
- Leverage fake timers for testing time-dependent functionality

## CODING_PRACTICES

### Guidelines for VERSION_CONTROL

#### GIT

- Use conventional commits to create meaningful commit messages
- Use feature branches with descriptive names following {{branch_naming_convention}}
- Write meaningful commit messages that explain why changes were made, not just what
- Keep commits focused on single logical changes to facilitate code review and bisection
- Use interactive rebase to clean up history before merging feature branches
- Leverage git hooks to enforce code quality checks before commits and pushes

#### CONVENTIONAL_COMMITS

- Follow the format: type(scope): description for all commit messages
- Use consistent types (feat, fix, docs, style, refactor, test, chore) across the project
- Define clear scopes based on {{project_modules}} to indicate affected areas
- Include issue references in commit messages to link changes to requirements
- Use breaking change footer (!: or BREAKING CHANGE:) to clearly mark incompatible changes
- Configure commitlint to automatically enforce conventional commit format


### Guidelines for STATIC_ANALYSIS

#### PRETTIER

- Define a consistent .prettierrc configuration across all {{project_repositories}}
- Configure editor integration to format on save for immediate feedback
- Use .prettierignore to exclude generated files, build artifacts, and {{specific_excluded_patterns}}
- Set printWidth based on team preferences (80-120 characters) to improve code readability
- Configure consistent quote style and semicolon usage to match team conventions
- Implement CI checks to ensure all committed code adheres to the defined style

#### ESLINT

- Configure project-specific rules in eslint.config.js to enforce consistent coding standards
- Use shareable configs like eslint-config-airbnb or eslint-config-standard as a foundation
- Implement custom rules for {{project_specific_patterns}} to maintain codebase consistency
- Configure integration with Prettier to avoid rule conflicts for code formatting
- Use the --fix flag in CI/CD pipelines to automatically correct fixable issues
- Implement staged linting with husky and lint-staged to prevent committing non-compliant code


### Guidelines for ARCHITECTURE

#### CLEAN_ARCHITECTURE

- Strictly separate code into layers: entities, use cases, interfaces, and frameworks
- Ensure dependencies point inward, with inner layers having no knowledge of outer layers
- Implement domain entities that encapsulate {{business_rules}} without framework dependencies
- Use interfaces (ports) and implementations (adapters) to isolate external dependencies
- Create use cases that orchestrate entity interactions for specific business operations
- Implement mappers to transform data between layers to maintain separation of concerns

#### DDD

- Define bounded contexts to separate different parts of the domain with clear boundaries
- Implement ubiquitous language within each context to align code with business terminology
- Create rich domain models with behavior, not just data structures, for {{core_domain_entities}}
- Use value objects for concepts with no identity but defined by their attributes
- Implement domain events to communicate between bounded contexts
- Use aggregates to enforce consistency boundaries and transactional integrity

#### MONOREPO

- Configure workspace-aware tooling to optimize build and test processes
- Implement clear package boundaries with explicit dependencies between packages
- Use consistent versioning strategy across all packages (independent or lockstep)
- Configure CI/CD to build and test only affected packages for efficiency
- Implement shared configurations for linting, testing, and {{development_tooling}}
- Use code generators to maintain consistency across similar packages or modules


### Guidelines for SUPPORT_LEVEL

#### SUPPORT_BEGINNER

- When running in agent mode, execute up to 3 actions at a time and ask for approval or course correction afterwards.
- Write code with clear variable names and include explanatory comments for non-obvious logic. Avoid shorthand syntax and complex patterns.
- Provide full implementations rather than partial snippets. Include import statements, required dependencies, and initialization code.
- Add defensive coding patterns and clear error handling. Include validation for user inputs and explicit type checking.
- Suggest simpler solutions first, then offer more optimized versions with explanations of the trade-offs.
- Briefly explain why certain approaches are used and link to relevant documentation or learning resources.
- When suggesting fixes for errors, explain the root cause and how the solution addresses it to build understanding. Ask for confirmation before proceeding.
- Offer introducing basic test cases that demonstrate how the code works and common edge cases to consider.

## BACKEND

### Guidelines for NODE

#### NEST

- Use dependency injection for services to improve testability and maintainability following SOLID principles
- Implement custom decorators for cross-cutting concerns to keep code DRY and maintain separation of business logic
- Use interceptors for transforming the response data structure consistently for {{api_standards}}
- Leverage NestJS Guards for authorization to centralize access control logic across {{protected_resources}}
- Implement domain-driven design with modules that encapsulate related functionality and maintain clear boundaries
- Use TypeORM or Mongoose with repository patterns to abstract database operations and simplify testing with mocks

