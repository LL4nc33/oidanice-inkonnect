const inkPreset = require('@oidanice/ink-ui/preset')

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [inkPreset],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    './node_modules/@oidanice/ink-ui/dist/**/*.{js,mjs}',
  ],
}
