/**
 * Dependency Injection Container Setup
 * Register all dependencies for the application
 */

import 'reflect-metadata';
import { container } from 'tsyringe';
import { INJECTION_TOKENS } from './types.js';

/**
 * Register dependencies
 * This will be populated in future phases as we create implementations
 */
export const setupContainer = (): void => {
  // Phase 1: Foundation - No implementations yet
  // Phase 2: Domain layer will add entities
  // Phase 3: Infrastructure layer will register repositories and external services
  // Phase 4: Application layer will register use cases
  // Phase 5: Presentation layer will register controllers

  // Example registrations (to be implemented in later phases):

  // Infrastructure - Repositories
  // container.register(INJECTION_TOKENS.RoomRepository, { useClass: MySqlRoomRepository });
  // container.register(INJECTION_TOKENS.UserRepository, { useClass: MySqlUserRepository });

  // Infrastructure - External Services
  // container.register(INJECTION_TOKENS.LivekitService, { useClass: LivekitAdapter });
  // container.register(INJECTION_TOKENS.SmsService, { useClass: SmsAdapter });

  // Application - Use Cases
  // container.register(INJECTION_TOKENS.CreateRoomUseCase, { useClass: CreateRoomUseCase });
  // container.register(INJECTION_TOKENS.JoinConferenceUseCase, { useClass: JoinConferenceUseCase });

  // Presentation - Controllers
  // Controllers are registered automatically with @injectable() decorator
};

/**
 * Get the DI container
 */
export const getContainer = () => container;

/**
 * Reset container (useful for testing)
 */
export const resetContainer = (): void => {
  container.clearInstances();
};

export { INJECTION_TOKENS } from './types.js';
export { container };
