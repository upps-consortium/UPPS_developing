const { fontFamily } = require('tailwindcss/defaultTheme');
module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: { extend: { colors: { primary: '#3b82f6', secondary: '#6366f1' }, fontFamily: { sans: ['Inter', ...fontFamily.sans] } } },
  plugins: [],
};
