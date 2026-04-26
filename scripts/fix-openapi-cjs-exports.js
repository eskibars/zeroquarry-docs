const fs = require("fs");
const path = require("path");

const assetsDir = path.join(__dirname, "..", "build", "assets", "js");

if (!fs.existsSync(assetsDir)) {
  console.warn("[fix-openapi-cjs-exports] No JS assets directory found.");
  process.exit(0);
}

let patchedFiles = 0;
let patchedReferences = 0;
const bareExportsPattern = /(^|[^.])\bexports\./g;

for (const file of fs.readdirSync(assetsDir)) {
  if (!/^common\..*\.js$/.test(file)) {
    continue;
  }

  const filePath = path.join(assetsDir, file);
  const original = fs.readFileSync(filePath, "utf8");
  const patched = original.replace(bareExportsPattern, "$1t.");

  if (patched !== original) {
    fs.writeFileSync(filePath, patched);
    patchedFiles += 1;
    patchedReferences += (original.match(bareExportsPattern) || []).length;
  }
}

if (patchedReferences > 0) {
  console.log(
    `[fix-openapi-cjs-exports] Patched ${patchedReferences} references in ${patchedFiles} file(s).`,
  );
} else {
  console.log("[fix-openapi-cjs-exports] No OpenAPI CJS export leaks found.");
}
