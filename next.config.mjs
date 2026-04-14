/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: process.env.BASEPATH,
  images: {
    remotePatterns: [{
      protocol: 'http',
      hostname: 'localhost',
      pathname: '**',
    },],
  },
  redirects: async () => {
    return [
      {
        source: '/',
        destination: '/en/dashboard/lms',
        permanent: true,
        locale: false
      },
      {
        source: '/:lang(en|fr|ar)',
        destination: '/:lang/dashboard/lms',
        permanent: true,
        locale: false
      },
    ]
  }
}

export default nextConfig
