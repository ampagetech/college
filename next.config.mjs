// next.config.mjs

const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true, // ✅ allow deployment even if lint fails
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'darfyrfxdzfsowtpjjww.supabase.co',
       
        pathname: '/storage/v1/object/public/**', // match all public files
      },
    ],
  },
};

export default nextConfig;
