import "server-only";
import { createHydrationHelpers } from "@trpc/react-query/rsc";
import { headers } from "next/headers";
import { cache } from "react";
import { NextRequest } from "next/server";
import { createCallerFactory, createTRPCRouter } from "@/server/trpc/trpc";
import { createTRPCContext } from "@/server/trpc/trpc";
import { appRouter } from "@/server/trpc/root";
import { makeQueryClient } from "./query-client";

const createContext = cache(async () => {
  const heads = new Headers(await headers());
  heads.set("x-trpc-source", "rsc");
  return createTRPCContext({
    req: new NextRequest("http://internal", { headers: heads }),
  });
});

const getQueryClient = cache(makeQueryClient);
const caller = createCallerFactory(appRouter)(createContext);

export const { trpc: api, HydrateClient } = createHydrationHelpers<typeof appRouter>(
  caller,
  getQueryClient,
);
