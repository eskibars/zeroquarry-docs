const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const buildDir = path.join(__dirname, "..", "build");
const assetsDir = path.join(buildDir, "assets", "js");
const bareExportsPattern = /(^|[^.])\bexports\./g;
const moduleStartPattern = /([,{])(\d+)\(([^)]*)\)\{/g;

if (!fs.existsSync(assetsDir)) {
  console.warn("[fix-openapi-cjs-exports] No JS assets directory found.");
  process.exit(0);
}

function findModuleRanges(source) {
  const starts = [];
  let match;

  while ((match = moduleStartPattern.exec(source)) !== null) {
    const params = match[3].split(",").map((param) => param.trim());
    const moduleParam = params[0];

    if (moduleParam) {
      starts.push({
        start: match.index,
        bodyStart: moduleStartPattern.lastIndex,
        moduleParam,
      });
    }
  }

  return starts.map((entry, index) => ({
    ...entry,
    end: index + 1 < starts.length ? starts[index + 1].start : source.length,
  }));
}

function patchBareExports(source) {
  const ranges = findModuleRanges(source);
  let cursor = 0;
  let patched = "";
  let references = 0;

  for (const range of ranges) {
    patched += source.slice(cursor, range.bodyStart);

    const body = source.slice(range.bodyStart, range.end);
    const patchedBody = body.replace(bareExportsPattern, (match, prefix) => {
      references += 1;
      return `${prefix}${range.moduleParam}.exports.`;
    });

    patched += patchedBody;
    cursor = range.end;
  }

  patched += source.slice(cursor);
  return {patched, references};
}

function contentHash(content) {
  return crypto.createHash("sha256").update(content).digest("hex").slice(0, 8);
}

function hashedAssetParts(file) {
  const match = file.match(/^(.+)\.([a-f0-9]{8})\.js$/);

  if (!match) {
    return undefined;
  }

  return {
    name: match[1],
    hash: match[2],
  };
}

function replaceInFile(filePath, replacements) {
  let content = fs.readFileSync(filePath, "utf8");
  let changed = false;

  for (const [from, to] of replacements) {
    if (content.includes(from)) {
      content = content.split(from).join(to);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content);
  }

  return changed;
}

function renameHashedAsset(filePath) {
  const file = path.basename(filePath);
  const parts = hashedAssetParts(file);

  if (!parts) {
    return undefined;
  }

  const content = fs.readFileSync(filePath, "utf8");
  const newHash = contentHash(content);

  if (newHash === parts.hash) {
    return undefined;
  }

  const renamed = `${parts.name}.${newHash}.js`;
  const renamedPath = path.join(path.dirname(filePath), renamed);
  fs.renameSync(filePath, renamedPath);

  return {
    from: file,
    fromHash: parts.hash,
    to: renamed,
    toHash: newHash,
  };
}

function replacementPairs(renames) {
  const pairs = [];

  for (const rename of renames) {
    pairs.push([rename.from, rename.to]);
    pairs.push([rename.fromHash, rename.toHash]);
  }

  return pairs;
}

function applyReplacements(renames) {
  const replacements = replacementPairs(renames);
  const changedJsAssets = new Set();
  const textExtensions = new Set([
    ".css",
    ".html",
    ".js",
    ".json",
    ".map",
    ".txt",
    ".xml",
  ]);

  for (const file of fs.readdirSync(buildDir, {recursive: true})) {
    const filePath = path.join(buildDir, file);

    if (!fs.statSync(filePath).isFile()) {
      continue;
    }

    if (!textExtensions.has(path.extname(filePath))) {
      continue;
    }

    if (replaceInFile(filePath, replacements) && path.extname(filePath) === ".js") {
      changedJsAssets.add(filePath);
    }
  }

  return changedJsAssets;
}

let patchedFiles = 0;
let patchedReferences = 0;
const renamedAssets = [];

for (const file of fs.readdirSync(assetsDir)) {
  if (!/\.js$/.test(file)) {
    continue;
  }

  const filePath = path.join(assetsDir, file);
  const original = fs.readFileSync(filePath, "utf8");
  const {patched, references} = patchBareExports(original);

  if (references === 0) {
    continue;
  }

  let outputFile = file;
  const hashedName = hashedAssetParts(file);

  if (hashedName) {
    const newHash = contentHash(patched);
    outputFile = `${hashedName.name}.${newHash}.js`;
    renamedAssets.push({
      from: file,
      fromHash: hashedName.hash,
      to: outputFile,
      toHash: newHash,
    });
  }

  fs.writeFileSync(path.join(assetsDir, outputFile), patched);

  if (outputFile !== file) {
    fs.unlinkSync(filePath);
  }

  patchedFiles += 1;
  patchedReferences += references;
}

if (renamedAssets.length > 0) {
  let changedJsAssets = applyReplacements(renamedAssets);
  let safetyCounter = 0;

  while (changedJsAssets.size > 0 && safetyCounter < 5) {
    const followUpRenames = [];

    for (const filePath of changedJsAssets) {
      if (fs.existsSync(filePath)) {
        const renamed = renameHashedAsset(filePath);

        if (renamed) {
          followUpRenames.push(renamed);
        }
      }
    }

    renamedAssets.push(...followUpRenames);
    changedJsAssets = followUpRenames.length > 0
      ? applyReplacements(followUpRenames)
      : new Set();
    safetyCounter += 1;
  }
}

if (patchedReferences > 0) {
  console.log(
    `[fix-openapi-cjs-exports] Patched ${patchedReferences} references in ${patchedFiles} file(s).`,
  );

  if (renamedAssets.length > 0) {
    console.log(
      `[fix-openapi-cjs-exports] Renamed ${renamedAssets.length} asset(s) so content hashes stay valid.`,
    );
  }
} else {
  console.log("[fix-openapi-cjs-exports] No OpenAPI CJS export leaks found.");
}
