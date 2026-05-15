import { PostHog } from "posthog-node";
import { env } from "@/env";

const globalForPostHog = globalThis as unknown as {
  posthog: PostHog | undefined;
};

export const posthog =
  globalForPostHog.posthog ??
  new PostHog(env.NEXT_PUBLIC_POSTHOG_KEY ?? "phc_placeholder", {
    host: env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com",
    flushAt: 1,
    flushInterval: 0,
  });

if (process.env.NODE_ENV !== "production") globalForPostHog.posthog = posthog;
