const fs = require("fs");
const path = require("path");

const source = fs.readFileSync(
  path.join(__dirname, "apps", "mobile", "app", "onboarding.tsx"),
  "utf8"
);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(
  !/left:\s*x\b/.test(source),
  "Floating tool animation must not assign animated x interpolation to left"
);
assert(
  !/top:\s*y\b/.test(source),
  "Floating tool animation must not assign animated y interpolation to top"
);
assert(
  /translateX:\s*x\b/.test(source),
  "Floating tool animation should move horizontally with transform.translateX"
);
assert(
  /translateY:\s*y\b/.test(source),
  "Floating tool animation should move vertically with transform.translateY"
);

console.log("Onboarding native-driver animation check passed");