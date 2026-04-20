import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "backend/**",
      ".agents/**",
      ".hermes/**",
      ".worktrees/**",
      "logs/**",
      "serch2/**",
      "stitch/**",
      "**/*.js",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
