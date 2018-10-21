var _ = require('underscore');
var GeoJS = require('geojs');

var autogenFeatureLayerModel = require('./featureLayer.autogen.js').featureLayerModel;


var featureLayerModel = autogenFeatureLayerModel.extend({

    defaults: function() {
        return _.extend(autogenFeatureLayerModel.prototype.defaults.call(this), {
            _features: [],
        });
    },

    constructGeoJSObject: function(layer) {
        console.log('featureLayer.buildGeoJSObject()');
        let map_model_id = this.get('map_id');
        console.log(`map_model_id: ${map_model_id}`);
        let map_model = this.widget_manager.get_model(map_model_id);
        console.log(`map_model:`);
        console.dir(map_model);

    }  // buildGeoJSObject()

});

module.exports = {
    featureLayerModel: featureLayerModel,
};
