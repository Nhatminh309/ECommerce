/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#172026',
        leaf: '#2f6f5e',
        coral: '#d95845',
        mist: '#f4f7f5',
      },
      boxShadow: {
        soft: '0 18px 50px rgba(23, 32, 38, 0.08)',
      },
    },
  },
  plugins: [],
};
