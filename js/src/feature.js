var _ = require('underscore');
var GeoJS = require('geojs');

var autogen_featureModel = require('./feature.autogen.js').featureModel;


var featureModel = autogen_featureModel.extend({

    defaults: function() {
        return _.extend(autogen_featureModel.prototype.defaults.call(this), {
            _model_name : 'featureModel',
            _model_module : 'pygeojs',
            _model_module_version : '0.1.0',
        });
    },

    constructGeoJSObjectAsync: function() {
        console.log('feature.constructGeoJSObjectAsync()');
        let layer_model_id = this.get('layer_id');
        console.log(`layer_model_id: ${layer_model_id}`);

        return new Promise(resolve => {
            this.widget_manager.get_model(layer_model_id)
                .then((layer_model => {
                    console.log(`layer_model:`);
                    console.dir(layer_model);
                    console.log(`featureType ${this.get('featureType')}`);
                    console.log('arguments:')
                    console.dir(arguments);

                    this.obj = layer_model.obj.createFeature(this.get('featureType'));

                    let dataArray = this.get('dataArray');
                    if (dataArray) {
                        console.log('dataArray');
                        console.dir(dataArray);
                        this.obj.data(dataArray);
                    }

                    // Convert position array to function, as required by GeoJS
                    let positionArray = this.get('positionArray');
                    if (positionArray) {
                        this.obj.position((dataItem, dataIndex) => {
                            console.debug(`dataIndex ${dataIndex}`);
                            // Workaround undiagnosed problem where dataIndex
                            // is sometimes undefined. It appears to be realted
                            // to mousemove events.
                            if (dataIndex === undefined) {
                                // Check for Kitware workaround
                                if ('__i' in dataItem) {
                                    console.warn('dataItem is undefined');
                                    dataIndex = dataItem.__i;
                                }
                                else {
                                    throw Error('dataIndex is undefined ');
                                }
                            } // if
                            let position = positionArray[dataIndex];
                            console.debug(`position ${position.x}, ${position.y}`);
                            return position;
                        });

                    }
                    else {
                        console.log('MISSING positionArray')
                    }


                    console.log(`geojs feature:`);
                    console.dir(this.obj);

                    // console.log(`map layers:`);
                    // console.dir(layer_model.obj.layers());

                    resolve(this.obj);
                }));
        });
    }  // buildGeoJSObject()

}, {
    model_name: 'featureModel',

    serializers: _.extend({
    },  autogen_featureModel.serializers),

});

module.exports = {
    featureModel: featureModel,
};
