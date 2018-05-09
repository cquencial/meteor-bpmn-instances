Package.describe({
  name: 'jkuester:bpmn-instances',
  version: '0.0.1',
  // Brief, one-line summary of the package.
  summary: 'Keep track of running Bpmn instances from jkuester:bpmn-engine',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md',
});

Package.onUse(function(api) {
  api.versionsFrom('1.6.1');
  api.use(['ecmascript', 'check', 'mongo']);
  api.use('jkuester:bpmn-engine');
  api.addFiles('bpmn-instances.js');
});

Package.onTest(function (api) {
  api.use('ecmascript');
  api.use('meteor');
  api.use('check');
  api.use('mongo');
  api.use('random');
  api.use('jkuester:bpmn-instances');
  api.use('meteortesting:mocha');
  api.use('practicalmeteor:chai');
  api.mainModule('bpmn-instances-tests.js');
});
