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

/*
        //console.log('osmLayerModel.buildGeoJSObject()');
        this.layer = layer;
        for (let _feature of this.get('_features')) {
            let model_id = _feature.slice(10);
            this.widget_manager.get_model(model_id)
                .then(model => {
                    //console.dir(model);
                    let featureModelName = model.get('_model_name');
                    let featureData = model.get('_data');
                    let positionData = model.get('position');
                    let styleData = model.get('style');
                    let geojsFeature = null;
                    switch(featureModelName) {
                        case 'pointFeatureModel':
                            geojsFeature = layer.createFeature('point');
                            geojsFeature.data(featureData);
                            geojsFeature.position((dataItem, dataIndex) => {
                              //console.debug(`dataIndex ${dataIndex}`);

                              // Workaround undiagnosed problem where dataIndex
                              // is sometimes undefined. It appears to be realted
                              // to mousemove events.
                              if (dataIndex === undefined) {
                                // Check for Kitware workaround
                                if ('__i' in dataItem) {
                                  //console.debug('dataItem is undefined');
                                  dataIndex = dataItem.__i;
                                }
                                else {
                                  throw Error('dataIndex is undefined ')
                                }
                              }  // if
                              let position = positionData[dataIndex];
                              // console.debug(`Position ${position}`);
                              return position;
                            });

                            geojsFeature.style(styleData);
                            //console.log(`Created feature ${geojsFeature}`);
                            //console.dir(geojsFeature);
                            break;

                        default:
                            console.log(`Unrecognized model name: ${featureModelName}`);
                            break;
                    }  // switch(featureModelName)
                });
        }  // for (_feature)
*/
    }  // buildGeoJSObject()

}, {
    model_name: 'osmLayerModel',

    serializers: _.extend({
    },  autogenosmLayerModel.serializers),

});

module.exports = {
    osmLayerModel: osmLayerModel,
};
