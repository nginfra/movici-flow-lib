export default function timing<T>(ident: string, f: () => T): T {
  const now = Date.now(),
    rv = f();
  console.log(`${ident}: ${Date.now() - now} ms`);
  return rv;
}
