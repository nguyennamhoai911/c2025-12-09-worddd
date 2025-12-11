/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    "@tailwindcss/postcss": {}, // 👈 Đổi dòng này
    autoprefixer: {},
  },
};

export default config;
