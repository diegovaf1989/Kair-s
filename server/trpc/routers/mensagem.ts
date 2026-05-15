import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc/trpc";

export const mensagemRouter = createTRPCRouter({
  inbox: protectedProcedure.query(({ ctx }) => {
    return ctx.db.mensagem.findMany({
      where: { destinatarioId: ctx.user.id },
      include: { remetente: { select: { id: true, nome: true } } },
      orderBy: { criadoEm: "desc" },
      take: 30,
    });
  }),

  marcarLida: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(({ ctx, input }) => {
      return ctx.db.mensagem.update({
        where: { id: input.id, destinatarioId: ctx.user.id },
        data: { lida: true },
      });
    }),

  naoLidas: protectedProcedure.query(async ({ ctx }) => {
    const count = await ctx.db.mensagem.count({
      where: { destinatarioId: ctx.user.id, lida: false },
    });
    return { count };
  }),
});
