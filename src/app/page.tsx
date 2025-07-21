
// This is now the recommended way to do a redirect in Next.js.
// The `redirect()` function is not called directly in the component.
// Instead, the middleware handles the redirect.
// See `src/middleware.ts` for the implementation.
export default function Home() {
  return null;
}
