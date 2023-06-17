const twDefaultTheme = require("tailwindcss/defaultTheme");

const jsExtensions = ["js", "mjs", "cjs", "jsx"];

const tsExtensions = jsExtensions.map((ext) => ext.replace("js", "ts"));

const extensions = ["html", ...tsExtensions, ...jsExtensions];

/** @type {import('tailwindcss/types/config').PluginCreator} */
const plugin = ({ addVariant, addBase }) => {
  for (const state of [
    "open",
    "instant-open",
    "delayed-open",
    "closed",
    "active",
    "inactive",
    "on",
    "off",
    "checked",
    "unchecked",
  ]) {
    addVariant(`d-${state}`, `&[data-state='${state}']`);
    addVariant(`group-d-${state}`, `.group[data-state='${state}'] &`);
  }
  for (const side of ["top", "right", "bottom", "left"]) {
    addVariant(`d-${side}`, `&[data-side='${side}']`);
    addVariant(`group-d-${side}`, `.group[data-side='${side}'] &`);
  }
  for (const align of ["start", "center", "end"]) {
    addVariant(`d-${align}`, `&[data-align='${align}']`);
    addVariant(`group-d-${align}`, `.group[data-align='${align}'] &`);
  }
  for (const attr of ["placeholder"]) {
    addVariant(`d-${attr}`, `&[data-${attr}]`);
    addVariant(`group-d-${attr}`, `.group[data-${attr}] &`);
  }
  addVariant("autofill", [
    "&:-webkit-autofill",
    "&:-webkit-autofill:hover",
    "&:-webkit-autofill:focus",
  ]);
  addBase({
    html: {
      "--tw-font-inconsolata": "Inconsolata",
      "--tw-font-inter": "Inter",
    },
  });
};

/** @type {(...dirs: string[]) => import('tailwindcss/types/config').Config} */
const config = (...dirs) => ({
  content: {
    relative: true,
    files: dirs.map((dir) => `${dir}/**/*.{${extensions.join(",")}}`),
  },
  theme: {
    extend: {
      fontFamily: {
        mono: ["var(--tw-font-inconsolata)", ...twDefaultTheme.fontFamily.mono],
        sans: ["var(--tw-font-inter)", ...twDefaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [require("@tailwindcss/forms"), plugin],
});

module.exports = config;
