/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: "#0E2A47",       // deep blue (headlines, primary)
          cream: "#F6EEE3",      // page background
          text: "#1F2937",       // default text (slate-700-ish)
          softwhite: "#FEFCF7",  // soft white panel
        },
      },
      boxShadow: {
        card: "0 10px 30px -10px rgba(0,0,0,.15)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};

