var _ = require('underscore');
const geojs = require('geojs');
console.debug(`Using geojs ${geojs.version}`);
var widgets = require('@jupyter-widgets/base');
var dataserializers = require('jupyter-dataserializers');

var sceneObjectModel = require('./sceneObject.js').sceneObjectModel;

var sceneModel = widgets.DOMWidgetModel.extend({

    initialize: function() {
        console.log('initialize sceneModel')
        sceneModel.__super__.initialize.apply(this, arguments);
        this.obj = null;
        this.createPropertiesArrays();
        this.constructGeoJSObject();
        this.syncToGeoJSObj(true);
        sceneObjectModel.prototype.setupListeners.call(this);

        this.on('msg:custom', function(content) {
            console.log(`CUSTOM MESSAGE: ${content}:`);
            console.dir(content);
            this.send('Received your custom message!');

            if (content.method == 'set_zoom_and_center') {
                let inputBounds = {
                    left:   content.params[0],
                    bottom: content.params[1],
                    right:  content.params[2],
                    top:    content.params[3],
                }
                console.log('inputBounds:');
                console.dir(inputBounds);

                // Adjust the vertical bounds to add top & bottom margin
                let bounds = {};
                let margin = 10;
                let height = this.obj.node().height();
                if (!height) {
                    console.log('Using default height of 480px to adjust viewpoint scale');
                    height = 480;
                }

                let factor = height / (height - 2.0*margin);
                if (factor > 1.0) {
                    console.log(`Adjusting vertical scale by ${factor}`);
                    let centerY = 0.5 * (inputBounds.top + inputBounds.bottom);
                    bounds.top = (inputBounds.top - centerY) * factor + centerY;
                    bounds.bottom = centerY - (centerY - inputBounds.bottom) * factor;
                }
                else {
                    bounds.top = inputBounds.top;
                    bounds.bottom = inputBounds.bottom;
                }
                bounds.left = inputBounds.left;
                bounds.right = inputBounds.right;

                let zc = this.obj.zoomAndCenterFromBounds(bounds);
                console.log('zoom & center:');
                console.dir(zc);
                this.obj.center(zc.center);
                this.obj.zoom(zc.zoom - 0.5);  // zoom out by fixed offset
            }
        }.bind(this));
    },

    defaults: function() {
        return _.extend(sceneObjectModel.prototype.defaults.call(this), {
            _model_name : 'sceneModel',
            _view_name : 'sceneView',
            _model_module : 'pygeojs',
            _view_module : 'pygeojs',
            _model_module_version : '0.1.0',
            _view_module_version : '0.1.0',

            allowRotation: true,
            autoResize: true,
            // bounds
            // camera
            center: {x: 0.0, y: 0.0},
            clampBoundsX: false,
            clampBoundsY: true,
            clampZoom: true,
            discreteZoom: false,
            gcs: "EPSG:3857",
            ingcs: "EPSG:4326",
            // interactor
            max: 16,
            maxBounds: {},
            min: 0,
            // origin
            // rotatedSize
            rotation: 0,
            unitsPerPixel: 156543,
            zoom: 4,
            // zoomRange

        });
    },

    constructGeoJSObject: function() {
        console.log('scene.constructGeoJSObject()');
        // console.dir(this);
        //console.assert(this.el, 'Error: this.el not defined');

        this.mapElement = document.createElement('div');
        this.mapElement.setAttribute('class', 'geojs-doc-element');
        this.mapElement.setAttribute('style', 'height: 100%; width: 100%');
        this.obj = geojs.map({node: this.mapElement});
        // console.log('map object:');
        // console.dir(this.obj);

        // Sync kernel on user pan
        this.obj.geoOn(geojs.event.pan, function(evnt) {
            const geoCenter = this.obj.center();
            // console.log(`geoCenter ${geoCenter.x}, ${geoCenter.y}`);
            const modelCenter = this.get('center');
            // console.log(`modelCenter ${modelCenter.x}, ${modelCenter.y}`)

            // Check that center hasn't changed "alot".
            // This averts a lockup condition that can occur when using
            // the mouse wheel to zoom. The cause is not fully understood,
            // but is related to numerical precision of the center coords.
            if ((geoCenter.x.toFixed(6) === modelCenter.x.toFixed(6)) &&
                (geoCenter.y.toFixed(6) === modelCenter.y.toFixed(6))) {
                return;  // close enough
            }
            this.set({center: geoCenter});
            this.save_changes();
        }.bind(this));

        // Sync kernel when user zooms map
        this.obj.geoOn(geojs.event.zoom, function(evnt) {
            // console.log(`Zoom event`);
            // console.dir(evnt);
            this.set('zoom', evnt.zoomLevel);
            this.save_changes();
        }.bind(this));

    },

    createPropertiesArrays: function() {
        console.log('Enter createPropertiesArrays()');

        sceneObjectModel.prototype.createPropertiesArrays.call(this);


        this.property_converters['allowRotation'] = 'convertBool';
        this.property_converters['autoResize'] = 'convertBool';
        this.property_converters['center'] = null;
        this.property_converters['clampBoundsX'] = 'convertBool';
        this.property_converters['clampBoundsY'] = 'convertBool';
        this.property_converters['clampZoom'] = 'convertBool';
        this.property_converters['discreteZoom'] = 'convertBool';
        this.property_converters['gcs'] = null;
        this.property_converters['ingcs'] = null;
        //this.property_converters['max'] = null;
        this.property_converters['maxBounds'] = null;
        //this.property_converters['min'] = null;
        this.property_converters['rotation'] = 'convertFloat';
        this.property_converters['unitsPerPixel'] = null;
        this.property_converters['zoom'] = 'convertFloat';

        // this.property_assigners['center'] = 'assignDict';
        // this.property_assigners['maxBounds'] = 'assignDict';
    },


    onChange: function(model, options) {
        // Next line dont work, and I wish I knew why...
        // model.prototype.updateGeoJSObj(false).bind(model);
        this.updateGeoJSObj(model, false);
    },

    onChildChanged: function(model, options) {
        console.debug('child changed: ' + model.model_id);
        // Let listeners (e.g. views) know:
        this.trigger('childchange', this);
    },

    // push data from model to geojs object
    syncToGeoJSObj: function(force) {
        this.updateGeoJSObj(this, force);
    },


    // Push changes in model to geojs object
    updateGeoJSObj: function(model, force) {
        // console.debug('onChange(), model:, options:');
        // console.log(model);
        // console.log(options);

        _.each(model.property_converters, function(converterName, propName) {
            //console.log(`converterName ${converterName}, propName ${propName}`)
            if (!model.hasChanged(propName)) {
                // Only set changed properties unless forced
                return;
            }
            console.debug(`propName ${propName} has changed`);

            // console.dir(this);
            var assigner = model[model.property_assigners[propName]] || sceneObjectModel.prototype.assignDirect;
            assigner = assigner.bind(model);
            if (!converterName) {
                assigner(this.obj, propName, model.get(propName));
                return;
            }

            converterName = converterName + 'ModelToThree';
            var converterFn = sceneObjectModel.prototype[converterName];
            if (!converterFn) {
                throw new Error('invalid converter name: ' + converterName);
            }

            assigner(model.obj, propName, converterFn.bind(sceneObjectModel)(model.get(propName), propName));
        }, model);

    },

});
// , {

//     model_name: 'mapModel',

//     serializers: _.extend({
//     },  sceneObjectModel.serializers),
// });

var sceneView = widgets.DOMWidgetView.extend({
    initialize: function(parameters) {
        console.log('initialize mapView:');
        // console.dir(parameters);
        // console.dir(arguments);
        sceneView.__super__.initialize.apply(this, arguments);

        // console.log('this:')
        // console.dir(this);

        this.obj = this.model.obj;
    },  // initialize()

    // Capture resize message in order to update map size
    processPhosphorMessage: function(msg) {
        // console.log('Message:');
        // console.dir(msg);
        sceneView.__super__.processPhosphorMessage.apply(this, arguments);
        if (this.el && this.obj && (msg.type == 'resize')) {
            console.debug(`resize`);
            // console.log('this.el:');
            // console.dir(this.el);
            this.obj.size({
                width: this.el.clientWidth,
                height: this.el.clientHeight
            });

            // Adjust for offset due to mapElement having relative position
            //this.model.mapElement.style.marginTop = this.model.mapElement.clientHeight;
            this.model.mapElement.setAttribute('style',
                `height: 100%; width: 100%; margin-top: ${this.model.mapElement.clientHeight}`);
            console.log(`mapElement (type ${typeof this.model.mapElement}):`);
            // console.dir(this.model.mapElement);

        }
    },  // processPhosphorMessage()

    render: function() {
        console.log('render sceneView');
        sceneView.__super__.render.apply(this, arguments);
        if (!this.obj) {
            console.assert('Scene not initialized');
            return;
        }

        console.assert(this.el, 'ERROR: this.el not defined');
        //this.el.textContent = 'Sure wish I could get this to work...';
        // console.log('mapElement:');
        // console.dir(this.model.mapElement);
        this.el.appendChild(this.model.mapElement);
        // console.log('this.el');
        // console.dir(this.el);

        this.obj.draw();
    },  // render()

});  // sceneView


module.exports = {
    sceneModel: sceneModel,
    sceneView: sceneView,
};
