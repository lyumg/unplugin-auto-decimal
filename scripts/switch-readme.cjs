// scripts/switch-readme.js
const fs = require('node:fs')
const path = require('node:path')
const process = require('node:process')

const [,,action] = process.argv

const readmeNPM = path.join(__dirname, '../README_NPM.md')
const readme = path.join(__dirname, '../README.md')

if (action === 'prepare') {
  if (fs.existsSync(readme)) {
    fs.copyFileSync(readme, `${readme}.backup`)
  }
  fs.copyFileSync(readmeNPM, readme)
}
else if (action === 'restore') {
  if (fs.existsSync(`${readme}.backup`)) {
    fs.renameSync(`${readme}.backup`, readme)
  }
}
