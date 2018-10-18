var pygeojs = require('./index');
var base = require('@jupyter-widgets/base');

module.exports = {
  id: 'pygeojs',
  requires: [base.IJupyterWidgetRegistry],
  activate: function(app, widgets) {
      console.log(`activating pygeojs plugin version ${pygeojs.version}`);
      widgets.registerWidget({
          name: 'pygeojs',
          version: pygeojs.version,
          exports: pygeojs
      });
  },
  autoStart: true
};
