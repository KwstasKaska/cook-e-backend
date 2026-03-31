import session from 'express-session';

export default session;

declare module 'express-session' {
  interface SessionData {
    userId: number;
    userRole: string;
  }
}
