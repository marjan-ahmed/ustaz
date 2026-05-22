// Ambient declarations so VS Code's TypeScript LSP stops complaining about
// Deno-style URL imports and the `Deno.*` global. These declarations are
// scoped to supabase/functions/** and ignored by the actual Deno runtime
// (which has its own real types).

declare module 'https://esm.sh/*';
declare module 'https://deno.land/*';
declare module 'jsr:*';
declare module 'npm:*';

declare const Deno: {
  env: { get(name: string): string | undefined };
  serve(handler: (req: Request) => Response | Promise<Response>): void;
};
