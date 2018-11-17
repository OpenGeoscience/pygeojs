var _ = require('underscore');
var widgets = require('@jupyter-widgets/base');

var GeoJS = require('geojs');

var geojsonFeatureCollectionModel = widgets.WidgetModel.extend({
    defaults: _.extend(widgets.DOMWidgetModel.prototype.defaults(), {
        _model_name : 'geojsonFeatureCollectionModel',
        _model_module : 'pygeojs',
        _model_module_version : '0.1.0',
        data: {},
        layer_id: '' ,
    }),

    initialize: function() {
        console.log('initializing ${this}');
        widgets.WidgetModel.prototype.initialize.apply(this, arguments);

        // Listen for updates
        this.on('change:data', this.data_changed, this);
        this.on('change:layer_id', this.layer_id_changed, this);
    },

    data_changed: function() {
        console.debug(`data_changed`);
        let layer_id = this.get('layer_id');
        // This code presumes that the kernel/python class sets the
        // data *after* the layer_id has been set, so that we can
        // proceed to create the geojs features on 'change:data' event.
        this.widget_manager.get_model(layer_id)
            .then(layer_model => {
                //let reader = GeoJS.createFileReader('json', layer_model.obj);
                let reader = GeoJS.createFileReader(
                    'geojsonReader', {'layer': layer_model.obj});
                let data = this.get('data');
                reader.read(data, function(features) {
                    console.log('features:');
                    console.dir(features);
                    layer_model.obj.map().draw();
                })  // reader.read()
            });  // then (layer_model)
    },  // data_changed()

    layer_id_changed: function() {
        console.debug(`layer_id changed to ${this.get('layer_id')}`);
    },  // layer_id_changed()
});

module.exports = {
    geojsonFeatureCollectionModel : geojsonFeatureCollectionModel,
};
