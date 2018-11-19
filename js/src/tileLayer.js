var _ = require('underscore');
var GeoJS = require('geojs');

var autogen_tileLayerModel = require('./tileLayer.autogen.js').tileLayerModel;


var tileLayerModel = autogen_tileLayerModel.extend({
    initialize: function() {
        tileLayerModel.__super__.initialize.apply(this, arguments);
    },

    createPropertiesArrays: function() {
        autogen_tileLayerModel.prototype.createPropertiesArrays.call(this);
    },

    // Returns list of immutable constructor argument names (hard-coded)
    getConstructorArgNames: function() {
        let argNames = [
            'animationDuration', 'baseUrl', 'cacheSize', 'imgFormat', 'keepLower',
            'maxLevel', 'minLevel', 'tileHeight', 'tileWidth', 'topDown', 'url',
            'wrapX', 'wrapY',
        ];
        return argNames.concat(tileLayerModel.__super__.getConstructorArgNames());
    },

    defaults: function() {
        return _.extend(autogen_tileLayerModel.prototype.defaults.call(this), {
        });
    },

});

module.exports = {
    tileLayerModel: tileLayerModel,
};
