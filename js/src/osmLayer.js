var _ = require('underscore');
var GeoJS = require('geojs');

var autogen_osmLayerModel = require('./osmLayer.autogen.js').osmLayerModel;


var osmLayerModel = autogen_osmLayerModel.extend({

    defaults: function() {
        return _.extend(autogen_osmLayerModel.prototype.defaults.call(this), {
            _model_name : 'osmLayerModel',
            _model_module : 'pygeojs',
            _model_module_version : '0.1.0',
        });
    },

    createPropertiesArrays: function() {
        autogen_osmLayerModel.prototype.createPropertiesArrays.call(this);
    },

    constructGeoJSObjectAsync: function() {
        console.log('osmLayer.constructGeoJSObjectAsync()');
        let map_model_id = this.get('map_id');
        console.log(`map_model_id: ${map_model_id}`);

        // Build dictionary of constructor-only args from tileLayer
        // These are read-only traits that don't otherwise get set
        // on client side.
        let args = Object.assign({}, this.constructor.args);
        let argNames = this.getConstructorArgNames();
        for (let argName of argNames) {
            let argValue = this.get(argName);
            // console.log(`argName ${argName}, argValue ${argValue}`);
            console.assert(argValue !== undefined, `${argName} not defined`);
            if (argValue != null) { // null ==> default
                args[argName] = argValue;
            }
        }

        // Two workarounds for layer attribution:
        // * Current logic does not propogate superclass constructor args
        // * Change null to undefined in order to workaround the lack of
        // "undefined" values in the python model.
        args.attribution = this.get('attribution');
        if (args.attribution === null) {
            delete args.attribution;
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
    },  autogen_osmLayerModel.serializers),

});

module.exports = {
    osmLayerModel: osmLayerModel,
};
