import type { APIRoute } from 'astro';
import { build } from '../config/site';

/** Deployment traceability: the deploy workflow verifies this SHA after publishing. */
export const GET: APIRoute = () =>
  new Response(
    `${JSON.stringify(
      {
        name: 'vireluma-web',
        version: build.version,
        sha: build.sha,
        environment: build.environment,
        builtAt: new Date().toISOString(),
      },
      null,
      2,
    )}\n`,
    { headers: { 'Content-Type': 'application/json; charset=utf-8' } },
  );
