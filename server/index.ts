import express from 'express';
import cors from 'cors';
import {createExpressMiddleware} from '@trpc/server/adapters/express';
import {t, createContext} from './trpc.js';
import {utilizationRouter} from './utilizationRouter.js';

const app = express();
app.use(cors());

const appRouter = t.router({
  utilization: utilizationRouter(t),
});

export type AppRouter = typeof appRouter;

app.use(
  '/api',
  createExpressMiddleware({
    router: appRouter,
    createContext,
  }),
);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
