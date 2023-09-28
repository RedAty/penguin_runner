/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    images: { unoptimized: true },
    compress: false,
    typescript: {
        // !! WARN !!
        // This is not for production use
        // !! WARN !!
        ignoreBuildErrors: true,
    }
}

module.exports = nextConfig
