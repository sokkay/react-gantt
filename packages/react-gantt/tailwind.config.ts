import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  corePlugins: {
    preflight: false,
  },
  prefix: "sg-",
  theme: {
    extend: {},
  },
} satisfies Config;
