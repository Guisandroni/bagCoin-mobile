const port = Number(process.env.PORT) || 8080;

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".eot": "application/vnd.ms-fontobject",
};

function getMimeType(path: string): string {
  const ext = path.slice(path.lastIndexOf("."));
  return MIME_TYPES[ext] ?? "application/octet-stream";
}

Bun.serve({
  port,
  async fetch(req) {
    const url = new URL(req.url);
    const pathname = url.pathname === "/" ? "/index.html" : url.pathname;

    const file = Bun.file(`./dist${pathname}`);
    if (await file.exists()) {
      const isStaticAsset = pathname.startsWith("/_expo/static/");
      return new Response(file, {
        headers: {
          "Content-Type": getMimeType(pathname),
          ...(isStaticAsset && {
            "Cache-Control": "public, max-age=31536000, immutable",
          }),
        },
      });
    }

    const indexFile = Bun.file("./dist/index.html");
    return new Response(indexFile, {
      headers: { "Content-Type": "text/html" },
    });
  },
});

console.log(`Static server running on port ${port}`);
