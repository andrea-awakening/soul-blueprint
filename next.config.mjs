// Files the calculation engine reads from disk at run time: the ephemeris data and the compiled
// Swiss Ephemeris binary for the server's operating system (it is loaded dynamically, so it must be listed).
const ENGINE = ['./ephe/**/*', './node_modules/sweph/prebuilds/**/*', './node_modules/sweph/*.js', './node_modules/sweph/package.json', './node_modules/node-gyp-build/**/*'];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // The Swiss Ephemeris binding is a native module: keep it out of the bundle.
  serverExternalPackages: ['sweph'],
  // Ship the ephemeris data and the city list with the server functions (they are read from disk at run time).
  outputFileTracingIncludes: {
    '/api/blueprint': [...ENGINE, './data/places.txt'],
    '/api/chapter': [...ENGINE, './data/places.txt'],
    '/api/places': ['./data/places.txt'],
    '/admin/tests': ENGINE,
  },
  poweredByHeader: false,
  agentRules: false,
};

export default nextConfig;
