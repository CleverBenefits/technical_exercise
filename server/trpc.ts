import {initTRPC, TRPCError} from '@trpc/server';
import type {CreateExpressContextOptions} from '@trpc/server/adapters/express';

const MOCK_TOKEN = 'mock-token-123';
const MOCK_USER = {
  id: 'user-1',
  name: 'Admin User',
  permissions: ['viewReports'],
};

export function createContext({req, res}: CreateExpressContextOptions) {
  return {req, res};
}

type Context = Awaited<ReturnType<typeof createContext>>;

export const t = initTRPC.context<Context>().create();

export type TRPCInstance = typeof t;

export function getAdminRoleProcedure(trpc: TRPCInstance) {
  return (permissions: string[]) =>
    trpc.procedure.use(async ({ctx, next}) => {
      const authHeader = ctx.req.headers.authorization;
      if (!authHeader || authHeader !== `Bearer ${MOCK_TOKEN}`) {
        throw new TRPCError({code: 'UNAUTHORIZED', message: 'Unauthorized'});
      }

      const hasPermissions = permissions.every((p) => MOCK_USER.permissions.includes(p));
      if (!hasPermissions) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Your account does not have permission to perform this action.',
        });
      }

      return next({ctx: {...ctx, user: MOCK_USER}});
    });
}
