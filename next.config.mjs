/** @type {import('next').NextConfig} */
export default {
  reactStrictMode: true,
  experimental: {
    // PGlite ships WASM + data files that must not be bundled by webpack.
    serverComponentsExternalPackages: ['@electric-sql/pglite'],
    // SQL migrations are read from disk at runtime; ship them with every function.
    outputFileTracingIncludes: { '/**': ['./drizzle/**'] },
  },
};
