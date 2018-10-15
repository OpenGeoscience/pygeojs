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

/*
        //console.log('featureLayerModel.buildGeoJSObject()');
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

});

module.exports = {
    featureLayerModel: featureLayerModel,
};
