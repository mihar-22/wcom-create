const validateNPMPackageName = require("validate-npm-package-name");
const { dashToCamelCase } = require('./utils');

module.exports = (targetDir, guessedAuthorInfo) => [{
  type: 'text',
  name: 'name',
  message: 'The name of your library?',
  initial: targetDir,
  validate(input) {
    if (input.trim().length === 0) return 'This field is required.';
    if ([...input].find(char => !(/([a-z]|-)/.test(char)))) {
      return 'The name can only contain lowercase letters (a-z) and dashes (-).'
    }
    if (input[input.length - 1] === '-') return 'The name cannot end in a dash (-).'
    return true;
  },
}, {
  type: 'text',
  name: 'corePkgName',
  message: 'The NPM package name of the core web component library?',
  initial: `@${targetDir}/core`,
  validate(input) {
    const { errors } = validateNPMPackageName(input);
    return !errors || errors[0];
  },
}, {
  type: 'text',
  name: 'description',
  message: 'A short description of what your awesome library is all about?',
}, {
  type: 'list',
  name: 'keywords',
  message: 'A few keywords that will help people discover your package (comma separated):',
  separator: ',',
}, {
  type: 'select',
  name: 'license',
  message: 'Pick a license (see https://choosealicense.com for more information):',
  choices: [
    { title: 'MIT', value: 'MIT' },
    { title: 'The Unlicense', value: 'Unlicense' },
    { title: 'BSD Zero Clause License', value: '0BSD' },
    { title: 'Apache License 2.0', value: 'Apache-2.0' },
    { title: 'BSD 2-Clause "Simplified" License', value: 'BSD-2-Clause' },
    { title: 'BSD 3-Clause "New" or "Revised" License', value: 'BSD-3-Clause' },
    { title: 'BSD 4-Clause "Original" or "Old" License', value: 'BSD-4-Clause' },
    { title: 'GNU General Public License v2.0', value: 'GPL-2.0' },
    { title: 'GNU General Public License v3.0', value: 'GPL-3.0' },
    { title: 'GNU Lesser General Public License v2.1', value: 'LGPL-2.1' },
    { title: 'GNU Lesser General Public License v3.0', value: 'LGPL-3.0' },
  ],
  initial: 0
}, {
  type: 'multiselect',
  name: 'integrations',
  message: 'Select the framework integrations you\'d like to include:',
  choices: [
    { title: 'Angular', value: 'angular' },
    { title: 'React', value: 'react' },
    { title: 'Svelte', value: 'svelte' },
    { title: 'Vue', value: 'vue' },
  ],
}, ...['angular', 'react', 'svelte', 'vue'].map(integration => ({
  type: 'text',
  name: `${dashToCamelCase(integration)}PkgName`,
  message: `The NPM package name of the ${integration} integration library?`,
  initial: (_, values) => `${values.corePkgName.startsWith('@') 
    ? `${values.corePkgName.split('/')[0]}/` 
    : `${values.name}-`}${integration}`,
  type: (_, values) => values.integrations.includes(integration) ? 'text' : null,
  validate(input) {
    const { errors } = validateNPMPackageName(input);
    return !errors || errors[0];
  },
})), {
  type: 'text',
  name: 'githubRepo',
  message: 'The name of the GitHub repository where this project is stored (eg: wcom/cli)?',
  format(input) {
    input = input.startsWith('https://') ? input.replace('https://github.com/', '') : input;
    return input.endsWith('/') ? input.slice(0, -1) : input;
  },
}, {
  type: 'text',
  name: 'authorName',
  message: 'Your full name for licensing and \`package.json\` purposes?',
  initial: guessedAuthorInfo.name,
}, {
  type: 'text',
  name: 'authorEmail',
  message: 'Your email for licensing and \`package.json\` purposes? (optional)',
  initial: guessedAuthorInfo.email,
}];