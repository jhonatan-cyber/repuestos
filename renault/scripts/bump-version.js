// Bumps the version in package.json. Usage: node scripts/bump-version.js [patch|minor|major]
// Default: minor (0.1.0 → 0.2.0). Reads/writes package.json only — no git tags.
const fs = require("fs")
const path = require("path")

const type = process.argv[2] || "minor"
const pkgPath = path.join(__dirname, "..", "package.json")
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"))

const [major, minor, patch] = pkg.version.split(".").map(Number)
const current = pkg.version

let next
if (type === "major") next = `${major + 1}.0.0`
else if (type === "patch") next = `${major}.${minor}.${patch + 1}`
else next = `${major}.${minor + 1}.0`

pkg.version = next
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n")
console.log(`Versión: ${current} → ${next} (${type})`)
