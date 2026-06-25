/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
        pathname: '/avatars/**',
      }
    ],
  },
  reactStrictMode: true,
  
  experimental: {
    serverActions: {
      allowedOrigins: ["primalheaven.com"],
      bodySizeLimit: '2mb'
    },
    // Add proper Turbopack configuration
    turbo: {
      resolveAlias: {
        // Ensure consistent React Server Components implementation
        'react-server-dom-webpack': 'react-server-dom-turbopack',
        'react-server-dom-webpack/client': 'react-server-dom-turbopack/client',
        'react-server-dom-webpack/server': 'react-server-dom-turbopack/server',
        'react-server-dom-webpack/client.edge': 'react-server-dom-turbopack/client.edge',
        'react-server-dom-webpack/server.edge': 'react-server-dom-turbopack/server.edge'
      }
    }
  },
  
  typescript: {
    // This is a temporary workaround
    ignoreBuildErrors: true,
  },
  
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Client-side fallbacks
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "ssh2": false,
        "crypto": false,
        "stream": false,
        "buffer": require.resolve('buffer/'),
        "util": require.resolve('util/'),
        "path": require.resolve('path-browserify'),
        "os": require.resolve('os-browserify/browser'),
        "fs": false,
        "net": false,
        "tls": false
      };
    }

    // Handle .node binary files
    if (isServer) {
      config.externals = [...config.externals, 'ssh2'];
    }

    config.experiments = { ...config.experiments, topLevelAwait: true };
    return config;
  }
};

module.exports = nextConfig;

