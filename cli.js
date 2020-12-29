#!/usr/bin/env node
const path = require('path');
const fs = require('fs-extra');
const argv = require('minimist')(process.argv.slice(2));
const kleur = require('kleur');
const prompts = require('prompts');
const buildQuestions = require('./src/buildQuestions');
const { promises } = require('fs-extra');
const { 
  write, copyTemplate, dashToPascalCase, 
  guessAuthorInfo, copyPkg, addGitIgnoreRules, 
  dashToCamelCase,
} = require('./src/utils');

async function init() {
  const targetDir = argv._[0] || '.';
  const cwd = process.cwd();
  const targetRoot = path.join(cwd, targetDir);

  console.log(kleur.cyan(`Scaffolding project in ${kleur.bold(targetRoot)}...`));

  await fs.ensureDir(targetRoot);
  const existing = await fs.readdir(targetRoot);
  if (existing.length) {
    throw Error(`Target directory \`${targetDir}\` is not empty.`);
  }

  const guessedAuthorInfo = await guessAuthorInfo();
  const questions = buildQuestions(targetDir, guessedAuthorInfo);
  // const answers = await prompts(questions);
  // anwers.moduleName = dashToPascalCase(answers.name);

  const answers = {
    name: 'vime',
    moduleName: 'Vime',
    license: 'MIT',
    description: 'This is an amazing library.',
    keywords: ['vime', 'player', 'video', 'audio'],
    corePkgName: '@vime/core',
    angularPkgName: '@vime/angular',
    reactPkgName: '@vime/react',
    vuePkgName: '@vime/vue',
    vueNextPkgName: '@vime/vue-next',
    sveltePkgName: '@vime/svelte',
    githubRepo: 'vime-js/vime',
    authorName: 'Rahim Alwer',
    authorEmail: 'rahim_alwer@outlook.com',
    integrations: ['angular', 'svelte', 'react', 'vue', 'vue-next'],
  };
  
  const getTemplateDir = (name) => path.join(
    __dirname,
    `template-${name}`
  );

  // -----------------------------
  // ROOT
  // -----------------------------

  console.log(kleur.magenta(`Writing ${kleur.bold('root')} template files...`));

  const rootTemplateDir = getTemplateDir('root');
  const rootTemplateFiles = await fs.readdir(rootTemplateDir);
  
  await Promise.all(
    rootTemplateFiles
      .filter(file => file !== 'package.json')
      .map(file => (file === 'README.md') 
        ? copyTemplate(targetRoot, rootTemplateDir, file, undefined, {
          CORE_PKG_NAME: answers.corePkgName,
          GITHUB_REPO: answers.githubRepo,
          MODULE_NAME: answers.moduleName,
        }) 
        : write(targetRoot, rootTemplateDir, file))
  );
  
  await copyTemplate(
    targetRoot, 
    getTemplateDir('license'), 
    `${answers.license.toLowerCase()}.txt`, 
    'LICENSE', {
      YEAR: `${new Date().getFullYear()}`,
      AUTHOR_NAME: answers.authorName,
    });
  
  await copyPkg(targetRoot, rootTemplateDir, {
    name: answers.name,
    license: answers.license,
    wcom: { packages: ['core', ...answers.integrations] }
  });
  
  // -----------------------------
  // CORE
  // -----------------------------
  
  const coreTemplateName = argv.t || argv.template || 'lit';
  const coreTemplateDir = getTemplateDir(coreTemplateName);
  const coreTemplateFiles = await fs.readdir(coreTemplateDir);
  const coreTargetRoot = path.join(targetRoot, 'core');
  
  console.log(kleur.magenta(`Writing ${kleur.bold(coreTemplateName)} template files...`));
  
  await Promise.all(
    coreTemplateFiles
      .filter(file => file !== 'package.json')
      .map(file => write(coreTargetRoot, coreTemplateDir, file))
  );
  
  await copyPkg(coreTargetRoot, coreTemplateDir, {
    ...answers,
    name: answers.corePkgName,
  });
  
  // -----------------------------
  // INTEGRATIONS
  // -----------------------------

  const gitIgnoreRules = {
    angular: [
      `integrations/angular/projects/core/src/${answers.moduleName}Module.ts`,
      'integrations/angular/projects/core/src/components/'
    ],
    react: [
      'integrations/react/src/components/',
    ],
    svelte: [
      'integrations/svelte/src/components/',
      'integrations/svelte/src/svelte/'
    ],
    vue: [
      'integrations/vue/src/components/',
    ],
    'vue-next': [
      'integrations/vue-next/src/components/',
    ],
  };

  await Promise.all(
    answers.integrations
      .map(async (integration) => {
        console.log(kleur.magenta(`Writing ${kleur.bold(integration)} template files...`));

        const integrationTargetRoot = path.join(targetRoot, `integrations/${integration}`);
        const integrationTemplateDir = getTemplateDir(`integrations/${integration}`);
        const integrationTemplateFiles = await fs.readdir(integrationTemplateDir);
        const notTemplate = new Set(['package.json', 'src', 'projects']);
        const integrationPkgName = answers[`${dashToCamelCase(integration)}PkgName`];

        await Promise.all(
          integrationTemplateFiles
            .filter(file => !notTemplate.has(file))
            .map(file => copyTemplate(
              integrationTargetRoot,
              integrationTemplateDir, 
              file, 
              undefined, {
                CORE_PKG_NAME: answers.corePkgName,
                DESCRIPTION: answers.description,
                [`${integration.toUpperCase().replace('-', '_')}_PKG_NAME`]: integrationPkgName,
              }))
        );
        
        // sort out src + projects

        const properName = integration.startsWith('vue') 
          ? `Vue ${integration.includes('next') ? 3 : 2}`
          : (integration.charAt(0).toUpperCase() + integration.slice(1));

        await copyPkg(integrationTargetRoot, integrationTemplateDir, {
          ...answers,
          name: integrationPkgName,
          description: `The ${properName} bindings for the ${answers.corePkgName} package.`,
          keywords: [
            integration,
            ...answers.keywords,
          ],
          dependencies: {
            [answers.corePkgName]: '0.0.0',
          },
        });

        // read in workflows and add in integration caching to each
      })
  );

  for (const integration of answers.integrations) {
    await addGitIgnoreRules(targetRoot, gitIgnoreRules[integration]);
  }

  // PROPER END MESSAGE
  console.log(kleur.cyan(`Finished!`));
}

init().catch((e) => {
  console.error(kleur.red(e))
  process.exit(1);
})