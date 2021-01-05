#!/usr/bin/env node
const path = require('path');
const fs = require('fs-extra');
const argv = require('minimist')(process.argv.slice(2));
const kleur = require('kleur');
const prompts = require('prompts');
const buildQuestions = require('./cli/buildQuestions');
const { promises } = require('fs-extra');
const { 
  write, copyTemplate, guessAuthorInfo, 
  copyPkg, dashToTitleCase 
} = require('./cli/utils');

async function init() {
  const targetDir = argv._[0] || '.';
  const cwd = process.cwd();
  const targetRoot = path.join(cwd, targetDir);

  console.log(kleur.cyan(`\nScaffolding project in ${kleur.bold(targetRoot)}...\n`));

  await fs.ensureDir(targetRoot);
  const existing = await fs.readdir(targetRoot);
  if (existing.length) {
    throw Error(`Target directory \`${targetDir}\` is not empty.`);
  }

  const guessedAuthorInfo = await guessAuthorInfo();
  const questions = buildQuestions(targetDir, guessedAuthorInfo);
  const answers = await prompts(questions);
  
  const getTemplateDir = (name) => path.join(
    __dirname,
    `template-${name}`
  );

  // -----------------------------
  // CORE
  // -----------------------------

  const coreTemplateName = argv.t || argv.template || 'lit';
  const coreTemplateDir = getTemplateDir(coreTemplateName);
  const coreTemplateFiles = await fs.readdir(coreTemplateDir);
  
  console.log(kleur.magenta(`\nWriting ${kleur.bold(coreTemplateName)} template files...`));
  
  await Promise.all(
    coreTemplateFiles
      .filter(file => file !== '_package.json')
      .map(file => (file === 'README.md') 
        ? copyTemplate(targetRoot, coreTemplateDir, file, undefined, {
          CORE_PKG_NAME: answers.corePkgName,
          GITHUB_REPO: answers.githubRepo,
          LIB_NAME: dashToTitleCase(answers.name),
        }) 
        : write(targetRoot, coreTemplateDir, file))
  );
  
  await copyTemplate(
    targetRoot, 
    getTemplateDir('license'), 
    `${answers.license.toLowerCase()}.txt`, 
    'LICENSE', {
      YEAR: `${new Date().getFullYear()}`,
      AUTHOR_NAME: answers.authorName,
    });
  
  await copyPkg(targetRoot, coreTemplateDir, {
    ...answers,
    name: answers.corePkgName,
    license: answers.license
  });
  
  console.log(kleur.cyan('\nDone 🚀\n\nNow run:\n'));
  
  if (targetRoot !== cwd) {
    console.log(kleur.bold(`  cd ${path.relative(cwd, targetRoot)}`));
  }

  console.log(kleur.bold('  npm install'));
  console.log(kleur.bold('  npm run serve'));
  console.log();
}

init().catch((e) => {
  console.error(kleur.red(e))
  process.exit(1);
})