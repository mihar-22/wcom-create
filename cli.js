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
  dashToCamelCase, copyTemplates, addStepsToWorkflow,
  upperCaseFirstChar,
} = require('./src/utils');

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
  answers.moduleName = dashToPascalCase(answers.name);
  
  const getTemplateDir = (name) => path.join(
    __dirname,
    `template-${name}`
  );

  // -----------------------------
  // ROOT
  // -----------------------------

  console.log(kleur.magenta(`\nWriting ${kleur.bold('root')} template files...`));

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
  };

  await Promise.all(
    answers.integrations
      .map(async (integration) => {
        console.log(kleur.magenta(`Writing ${kleur.bold(integration)} template files...`));

        const integrationTargetRoot = path.join(targetRoot, `integrations/${integration}`);
        const integrationTemplateDir = getTemplateDir(`integrations/${integration}`);
        const integrationPkgName = answers[`${dashToCamelCase(integration)}PkgName`];
        const integrationTemplateId = `${integration.toUpperCase().replace('-', '_')}_PKG_NAME`;
        const integrationProperName = upperCaseFirstChar(integration);

        await copyTemplates(integrationTargetRoot, integrationTemplateDir, {
          CORE_PKG_NAME: answers.corePkgName,
          MODULE_NAME: answers.moduleName,
          [integrationTemplateId]: integrationPkgName,
        });

        await copyPkg(integrationTargetRoot, integrationTemplateDir, {
          ...answers,
          name: integrationPkgName,
          description: `The ${integrationProperName} bindings for the ${answers.corePkgName} package.`,
          keywords: [
            integration,
            ...answers.keywords,
          ],
          dependencies: {
            [answers.corePkgName]: '0.0.0',
          },
        });
      })
  );
        
  const workflowsRoot = path.join(targetRoot, '.github/workflows');
  const insertBeforeStep  = 'Setup Git Identity';
  const newWorkflowSteps = answers.integrations.map(integration => `
      - name: Cache ${upperCaseFirstChar(integration)} Dependencies
        id: ${dashToCamelCase(integration)}Deps
        uses: actions/cache@v2
        with:
          path: 'integrations/${integration}/node_modules'
          key: deps-\${{ hashFiles('integrations/${integration}/package-lock.json') }}`);

  if (newWorkflowSteps.length > 0) {
    await addStepsToWorkflow(workflowsRoot, 'release.yml', insertBeforeStep, newWorkflowSteps);
    await addStepsToWorkflow(workflowsRoot, 'validate.yml', insertBeforeStep, newWorkflowSteps);
  }

  for (const integration of answers.integrations) {
    await addGitIgnoreRules(targetRoot, gitIgnoreRules[integration]);
  }

  console.log(kleur.cyan('\nDone 🚀\n\nNow run:\n'));
  
  if (targetRoot !== cwd) {
    console.log(kleur.bold(`  cd ${path.relative(cwd, targetRoot)}`));
  }

  console.log(kleur.bold('  npm install\n'));
  console.log(kleur.bold(`  cd ${path.relative(cwd, coreTargetRoot)}`));
  console.log(kleur.bold('  npm install'));
  console.log(kleur.bold('  npm run serve'));
  console.log();
}

init().catch((e) => {
  console.error(kleur.red(e))
  process.exit(1);
})