import { protectedProcedure, publicProcedure, router } from "../index";
import { todoRouter } from "./todo";
import { bankRouter } from "./bank";
import { cardRouter } from "./card";
import { categoryRouter } from "./category";
import { transactionRouter } from "./transaction";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session.user,
    };
  }),
  todo: todoRouter,
  bank: bankRouter,
  card: cardRouter,
  category: categoryRouter,
  transaction: transactionRouter,
});
export type AppRouter = typeof appRouter;
