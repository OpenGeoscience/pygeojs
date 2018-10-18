var _ = require('underscore');
var GeoJS = require('geojs');

var autogenosmLayerModel = require('./osmLayer.autogen.js').osmLayerModel;


var osmLayerModel = autogenosmLayerModel.extend({

    defaults: function() {
        return _.extend(autogenosmLayerModel.prototype.defaults.call(this), {
            _model_name : 'osmLayerModel',
            _model_module : 'pygeojs',
            _model_module_version : '0.1.0',
        });
    },

    constructGeoJSObjectAsync: function() {
        console.log('osmLayer.constructGeoJSObjectAsync()');
        let map_model_id = this.get('map_id');
        console.log(`map_model_id: ${map_model_id}`);

        // Build dictionary of constructor-only args (tileLayer)
        let args = {};
        let argNames = this.getConstructorArgNames();
        for (let argName of argNames) {
            let argValue = this.get(argName);
            console.assert(argValue !== undefined, `${argName} not defined`);
            if (argValue != null) { // null ==> default
                args[argName] = argValue;
            }
        }

        return new Promise(resolve => {
            this.widget_manager.get_model(map_model_id)
                .then((map_model => {
                    // console.log(`map_model:`);
                    // console.dir(map_model);

                    this.obj = map_model.obj.createLayer('osm', args);
                    // console.log(`osmLayer.obj:`);
                    // console.dir(this.obj);

                    // console.log(`map layers:`);
                    // console.dir(map_model.obj.layers());

                    resolve(this.obj);
                }));
        });
    }  // buildGeoJSObject()

}, {
    model_name: 'osmLayerModel',

    serializers: _.extend({
    },  autogenosmLayerModel.serializers),

});

module.exports = {
    osmLayerModel: osmLayerModel,
};