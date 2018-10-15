var pygeojs = require('./index');
var base = require('@jupyter-widgets/base');

module.exports = {
  id: 'pygeojs',
  requires: [base.IJupyterWidgetRegistry],
  activate: function(app, widgets) {
      widgets.registerWidget({
          name: 'pygeojs',
          version: pygeojs.version,
          exports: pygeojs
      });
  },
  autoStart: true
};

