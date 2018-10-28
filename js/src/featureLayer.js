var _ = require('underscore');
var GeoJS = require('geojs');

var autogen_featureLayerModel = require('./featureLayer.autogen.js').featureLayerModel;


var featureLayerModel = autogen_featureLayerModel.extend({

    defaults: function() {
        return _.extend(autogen_featureLayerModel.prototype.defaults.call(this), {
            _features: [],
        });
    },

    createPropertiesArrays: function() {
        autogen_featureLayerModel.prototype.createPropertiesArrays.call(this);
    },

    constructGeoJSObject: function(layer) {
        console.log('featureLayer.buildGeoJSObject()');
        let map_model_id = this.get('map_id');
        console.log(`map_model_id: ${map_model_id}`);
        let map_model = this.widget_manager.get_model(map_model_id);
        // console.log(`map_model:`);
        // console.dir(map_model);

        return new Promise(resolve => {
            this.widget_manager.get_model(map_model_id)
                .then((map_model => {
                    // console.log(`map_model:`);
                    // console.dir(map_model);
                    console.log(`creating feature layer`)

                    this.obj = map_model.obj.createLayer('feature');
                    // console.log(`featureLayer.obj:`);
                    // console.dir(this.obj);

                    // console.log(`map layers:`);
                    // console.dir(map_model.obj.layers());

                    resolve(this.obj);
                }));
        });
    }  // buildGeoJSObject()

});

module.exports = {
    featureLayerModel: featureLayerModel,
};
