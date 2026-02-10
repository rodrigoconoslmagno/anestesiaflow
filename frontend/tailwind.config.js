/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
      "node_modules/primereact/**/*.js",
    ],
    theme: {
      extend: {
        colors: {
          'ap-blue-dark': '#003366',    // Azul marinho do site
          'ap-blue-light': '#0055a4',   // Azul secundário
          'ap-cyan': '#00aec7',         // Detalhes em ciano/verde água
          'ap-bg': '#f8fafc',           // Fundo cinza bem claro
          primary: '#3B82F6',
        },
      },
    },
    plugins: [],
  }