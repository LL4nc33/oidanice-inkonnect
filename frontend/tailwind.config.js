const kindlePreset = require('@oidanice/kindle-ui/preset')

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [kindlePreset],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    './node_modules/@oidanice/kindle-ui/dist/**/*.{js,mjs}',
  ],
}
