/** @type {import('next').Config} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/book/:path*',
        destination: '/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;