#!/usr/bin/env node
/**
 * Bump @sokkay/react-gantt, update CHANGELOG, commit and tag.
 *
 * Usage:
 *   pnpm release patch
 *   pnpm release minor
 *   pnpm release major
 *   pnpm release 1.2.3
 *
 * Then publish locally and push:
 *   pnpm --filter @sokkay/react-gantt build
 *   pnpm --filter @sokkay/react-gantt publish --access public
 *   git push && git push origin vX.Y.Z
 */

import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const packageDir = join(root, 'packages/react-gantt')
const packageJsonPath = join(packageDir, 'package.json')
const changelogPath = join(packageDir, 'CHANGELOG.md')

const bumpArg = process.argv[2]

if (!bumpArg) {
  console.error('Usage: pnpm release <patch|minor|major|x.y.z>')
  process.exit(1)
}

function run(command, options = {}) {
  return execSync(command, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    ...options,
  }).trim()
}

function parseVersion(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version)
  if (!match) {
    throw new Error(`Invalid version: ${version}`)
  }
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  }
}

function bumpVersion(current, type) {
  if (/^\d+\.\d+\.\d+$/.test(type)) {
    return type
  }

  const { major, minor, patch } = parseVersion(current)

  switch (type) {
    case 'major':
      return `${major + 1}.0.0`
    case 'minor':
      return `${major}.${minor + 1}.0`
    case 'patch':
      return `${major}.${minor}.${patch + 1}`
    default:
      throw new Error(`Unknown bump type: ${type}. Use patch, minor, major, or x.y.z`)
  }
}

function getCommitsSinceLastTag() {
  let range = 'HEAD'
  try {
    const lastTag = run('git describe --tags --abbrev=0')
    range = `${lastTag}..HEAD`
  } catch {
    // First release: use all commits.
  }

  try {
    const log = run(`git log ${range} --pretty=format:%s`)
    return log
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((line) => !/^chore:\s*release\b/i.test(line))
      .filter((line) => !/^Version Packages$/i.test(line))
  } catch {
    return []
  }
}

function updateChangelog(version, commits) {
  const date = new Date().toISOString().slice(0, 10)
  const bullets =
    commits.length > 0
      ? commits.map((commit) => `- ${commit}`).join('\n')
      : '- Manual release'

  const section = `## ${version}\n\n_${date}_\n\n${bullets}\n`

  let changelog = ''
  try {
    changelog = readFileSync(changelogPath, 'utf8')
  } catch {
    changelog = '# @sokkay/react-gantt\n'
  }

  const heading = '# @sokkay/react-gantt'
  if (changelog.startsWith(heading)) {
    changelog = `${heading}\n\n${section}${changelog.slice(heading.length).replace(/^\n+/, '\n')}`
  } else {
    changelog = `${heading}\n\n${section}\n${changelog}`
  }

  writeFileSync(changelogPath, changelog)
}

const status = run('git status --porcelain')
if (status) {
  console.error('Working tree is dirty. Commit or stash changes before releasing.')
  process.exit(1)
}

const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
const currentVersion = packageJson.version
const nextVersion = bumpVersion(currentVersion, bumpArg)
const tag = `v${nextVersion}`

try {
  run(`git rev-parse ${tag}`)
  console.error(`Tag ${tag} already exists.`)
  process.exit(1)
} catch {
  // Tag is available.
}

const commits = getCommitsSinceLastTag()

packageJson.version = nextVersion
writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`)
updateChangelog(nextVersion, commits)

run(`git add ${packageJsonPath} ${changelogPath}`)
run(`git commit -m "chore: release ${tag}"`)
run(`git tag ${tag}`)

console.log(`
Prepared ${packageJson.name}@${nextVersion} (${tag})

Next steps:
  pnpm --filter @sokkay/react-gantt build
  pnpm --filter @sokkay/react-gantt publish --access public
  git push
  git push origin ${tag}
`)
