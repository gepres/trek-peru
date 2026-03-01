// Barrel export de todos los repositorios de Supabase
export { createRouteRepository } from './route.repository';
export type { RouteRepository } from './route.repository';

export { createUserRepository } from './user.repository';
export type { UserRepository } from './user.repository';

export { createAttendeeRepository } from './attendee.repository';
export type { AttendeeRepository, AttendeeCreateData } from './attendee.repository';

export { createCommentRepository } from './comment.repository';
export type { CommentRepository, CommentCreateData, CommentUpdateData } from './comment.repository';

export { createFavoriteRepository } from './favorite.repository';
export type { FavoriteRepository } from './favorite.repository';
