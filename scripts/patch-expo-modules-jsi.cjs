const fs = require("fs");
const path = require("path");

const root = path.join(
  __dirname,
  "..",
  "node_modules",
  "expo-modules-jsi",
  "apple",
  "Sources",
  "ExpoModulesJSI",
);

function walk(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

for (const file of walk(root)) {
  if (!file.endsWith(".swift")) {
    continue;
  }

  const original = fs.readFileSync(file, "utf8");
  const patched = original
    .replace(/\bprivate weak (?:let|var) runtime:/g, "private nonisolated(unsafe) weak var runtime:")
    .replace(/\binternal weak (?:let|var) runtime:/g, "internal nonisolated(unsafe) weak var runtime:")
    .replace(/\bweak (?:let|var) runtime:/g, "nonisolated(unsafe) weak var runtime:")
    .replace(/(?:nonisolated\(unsafe\)\s+){2,}/g, "nonisolated(unsafe) ");

  if (patched !== original) {
    fs.writeFileSync(file, patched);
  }
}
