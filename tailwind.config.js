/** Configurazione dello stile (Tailwind). Serve solo per rigenerare styles.css. */
module.exports = {
  content: ['./index.html'],
  theme: {
    extend: {
      colors: {
        salvia: { 50: '#f4f7f4', 100: '#e3ece3', 200: '#c5d8c5', 300: '#9dbf9e', 500: '#5e8760', 600: '#4c6f4e', 700: '#3d583e', 800: '#2b3f2c' },
        cipria: { 50: '#fdf9f8', 100: '#f8ede8', 200: '#edd5cc', 300: '#dfb5a6', 400: '#ce9380', 500: '#ba735f' },
        avorio: '#fcfaf5',
        crema: '#f4ece1',
        legno: '#4a3b2c',
        oro: '#c8a85f',
        dorato: '#dfb76c'
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'serif'],
        script: ['"Alex Brush"', 'cursive'],
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      }
    }
  }
}
