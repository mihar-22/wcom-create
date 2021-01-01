const fs = require('fs-extra');
const path = require('path');
const { promisify } = require('util');
const { exec } = require("child_process");

const clearAndUpper = (text) => text.replace(/-/, "").toUpperCase();
const dashToPascalCase = (text) => text.replace(/(^\w|-\w)/g, clearAndUpper);
const dashToCamelCase = (text) => text.replace(/-([a-z])/g,  (g) => g[1].toUpperCase());
const upperCaseFirstChar = (text) => text.charAt(0).toUpperCase() + text.slice(1)

const renameFiles = {
  _gitignore: '.gitignore',
};

const write = async (targetRoot, templateDir, fileName, content) => {
  const targetPath = renameFiles[fileName]
    ? path.join(targetRoot, renameFiles[fileName])
    : path.join(targetRoot, fileName);

  if (content) {
    await fs.writeFile(targetPath, content);
  } else {
    await fs.copy(path.join(templateDir, fileName), targetPath);
  }
}

const isDirectory = async (file) => {
  const lstat = promisify(fs.lstat);
  return (await lstat(file)).isDirectory();
};

const copyTemplates = async (targetRoot, templateDir, replace) => {
  const files = await fs.readdir(templateDir);
  for (const file of files) {
    if (await isDirectory(path.join(templateDir, file))) {
      await copyTemplates(path.join(targetRoot, file), path.join(templateDir, file), replace);
    } else {
      await copyTemplate(targetRoot, templateDir, file, undefined, replace);
    }
  }
}

const copyTemplate = async (targetRoot, templateDir, fileName, outFileName, replace) => {
  const readPath = path.join(templateDir, fileName);
  const writePath = path.join(targetRoot, outFileName || fileName);
  let content = (await fs.readFile(readPath)).toString();
  Object.keys(replace).forEach(template => {
    content = content.replace(new RegExp(`\{\{${template}\}\}`, 'g'), replace[template]);
  });
  await fs.mkdir(path.dirname(writePath), { recursive: true });
  await fs.writeFile(writePath, content);
};

const sortPkg = (pkg) => {
  const order = [
    'name',
    'private',
    'version',
    'description',
    'license',
    'engines',
    'sideEffects',
    'main',
    'module',
    'types',
    'files', 
    'contributors',
    'repository',
    'bugs',
    'scripts',
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'publishConfig',
    'keywords',
    '@wcom',
  ];

  return Object.keys(pkg)
    .sort((a, b) => order.indexOf(a) - order.indexOf(b))
    .reduce((prev, key) => ({ ...prev, [key]: pkg[key] }), {});
};

const copyPkg = async (targetRoot, templateDir, pkgInfo) => {
  const readPath = path.join(templateDir, 'package.json');
  const writePath = path.join(targetRoot, 'package.json');
  let pkg = JSON.parse((await fs.readFile(readPath)).toString());
  pkg.name = pkgInfo.name;
  pkg.description = pkgInfo.description;
  pkg.license = pkgInfo.license;

  if (pkgInfo.wcom) {
    pkg['@wcom'] = pkgInfo.wcom;
  }

  if (Array.isArray(pkgInfo.keywords) && pkgInfo.keywords.length > 0) {
    if (pkgInfo.keywords.length > 1 || pkgInfo.keywords[0].length > 0) {
      pkg.keywords = pkgInfo.keywords;
    }
  }

  if (pkgInfo.dependencies) {
    pkg.dependencies = {
      ...(pkg.dependencies || {}),
      ...pkgInfo.dependencies,
    };
  } 
  
  if (pkgInfo.name.startsWith('@')) {
    pkg.publishConfig = { access: 'public' };
  }
  
  if (pkgInfo.authorName) {
    const hasEmail = pkgInfo.authorEmail && pkgInfo.authorEmail.length > 0;
    pkg.contributors = [
      `${pkgInfo.authorName}${(hasEmail ? ` <${pkgInfo.authorEmail}>` : '')}`
    ];
  }

  if (pkgInfo.githubRepo) {
    pkg.repository = {
      type: 'git',
      url: `https://github.com/${pkgInfo.githubRepo}.git`
    };

    pkg.bugs = {
      url: `https://github.com/${pkgInfo.githubRepo}/issues`
    };
  }

  await fs.writeFile(writePath, JSON.stringify(sortPkg(pkg), undefined, 2));
};

const addStepsToWorkflow = async (workflowRoot, workflowFile, beforeStepName, steps) => {
  const filePath = path.join(workflowRoot, workflowFile);
  const content = (await fs.readFile(filePath)).toString();
  const lines = content.split('\n');
  const index = lines.findIndex(line => line.includes(`- name: ${beforeStepName}`)) - 1;
  
  let newLines = [];
  steps.forEach(step => { newLines = [...newLines, ...step.split('\n')]; });
  
  const newContent = [
    ...lines.slice(0, index),
    ...newLines,
    ...lines.slice(index)
  ].join('\n');

  await fs.writeFile(filePath, newContent);
};

const addGitIgnoreRules = async (targetRoot, rules) => {
  const filePath = path.join(targetRoot, '.gitignore');
  let content = await fs.readFile(filePath);
  rules.forEach((rule) => { content += `\n${rule}`; });
  content += '\n';
  await fs.writeFile(filePath, content);
};

const guessAuthorInfo = async () => {  
  try {
    const clean = (input) => input ? input.trim().replace('\n', '') : '';
    const { stdout: name } = await promisify(exec)('git config user.name');
    const { stdout: email } = await promisify(exec)('git config user.email');
    return { name: clean(name), email: clean(email) };
  } catch (e) {
    return {};
  }
};

module.exports = {
  write,
  copyPkg,
  copyTemplate,
  copyTemplates,
  dashToPascalCase,
  dashToCamelCase,
  upperCaseFirstChar,
  guessAuthorInfo,
  addGitIgnoreRules,
  addStepsToWorkflow,
};