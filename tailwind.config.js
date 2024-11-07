/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./views/**/*.ejs', './public/**/*.js'],
  theme: {
    extend: {
      colors: {
        rGreen: '#00AF9A',
        rBlue: '#230871',
      },
    },
  },
  plugins: [],
};
