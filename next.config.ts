import type {NextConfig} from 'next';

const isGithubActions = process.env.GITHUB_ACTIONS === 'true';

let assetPrefix = '';
let basePath = '';

if (isGithubActions && process.env.GITHUB_REPOSITORY) {
  // GITHUB_REPOSITORY is in the format <owner>/<repository_name>
  // We need to extract the <repository_name> for the basePath
  const repo = process.env.GITHUB_REPOSITORY.replace(/.*?\//, '');
  assetPrefix = `/${repo}/`;
  basePath = `/${repo}`;
}

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
};

export default nextConfig;
