/** @type {import('tailwindcss').Config} */
export default {
  content: [
      "./index.html",
    "./src/**/*.{js,ts,json}",
  ],
  theme: {
    extend: {
       colors: {
                'whatsapp': '#25D366',
                'whatsapp-dark': '#075E54',
                'whatsapp-light': '#DCF8C6'
            }
    },
  },
  plugins: [],
}

