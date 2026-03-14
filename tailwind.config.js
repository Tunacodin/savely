const { colors } = require("./constants/colors");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Rubik_400Regular"],
        "sans-medium": ["Rubik_500Medium"],
        "sans-semibold": ["Rubik_600SemiBold"],
        "sans-bold": ["Rubik_700Bold"],
      },
      colors: {
        primary: colors.primary,
        secondary: colors.secondary,
        accent: colors.accent,
        neutral: colors.neutral,
        success: colors.success,
        warning: colors.warning,
        error: colors.error,
        info: colors.info,
        background: colors.background,
      },
    },
  },
  plugins: [],
};
