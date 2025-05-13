
import type {NextConfig} from 'next';

// Always use the specific basePath and assetPrefix for sahilsol0.github.io/Zenith-timer/
const repoName = 'Zenith-timer';
const assetPrefix = `/${repoName}/`;
const basePath = `/${repoName}`;

const nextConfig: NextConfig = {
  output: 'export', // Enable static HTML export
  assetPrefix: assetPrefix, // Set asset prefix for correct asset loading on GitHub Pages
  basePath: basePath, // Set base path for routing on GitHub Pages
  trailingSlash: true, // Recommended for static exports and GitHub Pages consistency
  images: {
    unoptimized: true, // Disable Next.js image optimization for static export compatibility
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath, // Expose basePath to client-side code
  }
};

export default nextConfig;
