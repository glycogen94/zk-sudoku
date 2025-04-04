/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@zk-sudoku/ui", "@zk-sudoku/core"],
  
  // WebAssembly 지원을 위한 웹팩 설정
  webpack(config, { isServer }) {
    // WASM 모듈을 비동기적으로 로드하기 위한 설정
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    config.output.webassemblyModuleFilename = (isServer ? '../' : '') + 'static/wasm/[modulehash].wasm';

    return config;
},
};

module.exports = nextConfig;
