/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
      "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
      "./src/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
      extend: {
        fontFamily: {
          sans: ['var(--font-pretendard)'],
          mono: ['var(--font-jetbrains)'],
        },
        colors: {
          app: {
            bg: 'var(--app-background)',
          },
          point: 'var(--point-color)',
          neon: {
            green: 'var(--point-color)',
          },
        },
      },
    },
    plugins: [],
  }
