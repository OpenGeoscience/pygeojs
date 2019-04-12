// Todo - base class for all current source
var _ = require('underscore');
var widgets = require('@jupyter-widgets/base');
// var Promise = require('bluebird');
// var ndarray = require('ndarray');
var dataserializers = require('jupyter-dataserializers');

var geojs = require('geojs');

// var Enums = require('./enums');

// var utils = require('./utils');

//var EXTENSION_SPEC_VERSION = require('../version').EXTENSION_SPEC_VERSION;
// Hard-code version for now
var EXTENSION_SPEC_VERSION = '0.1.0';

/**
 * Helper function for listening to child models in lists/dicts
 *
 * @param {any} model The parent model
 * @param {any} propNames The propetry names that are lists/dicts
 * @param {any} callback The callback to call when child changes
 */
function listenNested(model, propNames, callback) {
    propNames.forEach(function(propName) {
        // listen to current values in array
        var curr = model.get(propName) || [];
        // support properties that are either an instance, or a
        // sequence of instances:
        if (curr instanceof ThreeModel) {
            model.listenTo(curr, 'change', callback);
            model.listenTo(curr, 'childchange', callback);
        } else {
            utils.childModelsNested(curr).forEach(function(childModel) {
                model.listenTo(childModel, 'change', callback);
                model.listenTo(childModel, 'childchange', callback);
            });
        }

        // make sure to (un)hook listeners when array changes
        model.on('change:' + propName, function(model, value) {
            var prev = model.previous(propName) || [];
            var curr = value || [];

            // Check for instance values:
            if (prev instanceof ThreeModel) {
                model.stopListening(prev);
            }
            if (curr instanceof ThreeModel) {
                model.listenTo(curr, 'change', callback);
                model.listenTo(curr, 'childchange', callback);
            }
            // Done if both are instance values:
            if (prev instanceof ThreeModel && curr instanceof ThreeModel) {
                return;
            }
            if (prev instanceof ThreeModel) {
                // Implies curr is array
                utils.childModelsNested(curr).forEach(function(childModel) {
                    model.listenTo(childModel, 'change', callback);
                    model.listenTo(childModel, 'childchange', callback);
                });
            } else if (curr instanceof ThreeModel) {
                // Implies prev is array
                utils.childModelsNested(prev).forEach(function(childModel) {
                    model.stopListening(childModel);
                });
            } else {
                // Both are arrays
                var diff = utils.nestedDiff(curr, prev);

                diff.added.forEach(function(childModel) {
                    model.listenTo(childModel, 'change', callback);
                    model.listenTo(childModel, 'childchange', callback);
                });
                diff.removed.forEach(function(childModel) {
                    model.stopListening(childModel);
                });
            }
        });
    });
}


var sceneObjectModel = widgets.WidgetModel.extend({

    defaults: function() {
        return _.extend(widgets.WidgetModel.prototype.defaults.call(this), {
            _model_name: this.constructor.model_name,
            _model_module: this.constructor.model_module,
            _model_module_version: this.constructor.model_module_version
            // _model_name : 'sceneObjectModel',
            // _model_module : 'pygeojs',
            // _model_module_version : '0.1.0',
        });
    },

    initialize: function(attributes, options) {
        widgets.WidgetModel.prototype.initialize.apply(this, arguments);
        //console.log(`init sceneObjectModel; constructor ${this.constructor}:`);
        console.log(`this.constructor.model_name ${this.constructor.model_name}`);
        //console.log(`this.constructor.model_module`);
        this.obj = {};
        this.createPropertiesArrays();

        // if (options.three_obj) {
        //     // We are defining the object from a given THREE object!

        //     // We need to push a default state first, as comm open does
        //     // not support buffers!
        //     // Fixed in:
        //     // - @jupyterlab/services@0.49.0
        //     // - notebook 5.1.0
        //     this.save_changes();

        //     var obj = options.three_obj;
        //     delete options.three_obj;

        //     this.processNewObj(obj);

        //     this.initPromise = this.createUninitializedChildren().bind(this).then(function() {

        //         // sync in all the properties from the THREE object
        //         this.syncToModel(true);

        //         // setup msg, model, and children change listeners
        //         this.setupListeners();

        //     });
        //     return;
        // }

        // Instantiate GeoJS.js object
        this.initPromise = this.createGeoJSObjectAsync().then(() => {
            return this.createUninitializedChildren();
        }).then(() => {

            // pull in props created by geojs
            this.syncToModel();

            // // sync the rest from the server to the model
            this.syncToGeoJSObj(true);

            // setup msg, model, and children change listeners
            this.setupListeners();
        });

    },

    // Over-ride this method to customize how GeoJS object is created
    constructGeoJSObject: function() {console.log('sceneObject.constructGeoJSObject')},

    createPropertiesArrays: function() {
        console.log('sceneObjectModel.createPropertiesArrays()');
        this.geojs_properties = [];
        this.geojs_nested_properties = [];
        this.datawidget_properties = [];

        this.props_created_by_geojs = {};
        this.property_converters = {};
        this.property_assigners = {};
        this.property_mappers = {};

        this.initialized_from_geojs = {};
    },

    createGeoJSObjectAsync: function() {

        var objPromise;

        // call constructor method overridden by every class
        // check for custom async three obj creator
        if (this.constructGeoJSObjectAsync) {
            objPromise = this.constructGeoJSObjectAsync();
        } else if (this.constructGeoJSObject) {
            objPromise = Promise.resolve(this.constructGeoJSObject());
        } else {
            throw new Error('no THREE construct method exists: this.createThreeObjectAsync');
        }

        return objPromise.then(obj => this.processNewObj);


    },

    createUninitializedChildren: function() {

        // Get any properties to create from this side
        var uninit = _.filter(this.geojs_properties, function(propName) {
            return this.get(propName) === 'uninitialized';
        }, this);

        // Return promise for their creation
        return Promise.all(_.map(uninit, function(propName) {
            this.initialized_from_three[propName] = true;
            var obj = this.obj[propName];
            // First, we need to figure out which model constructor to use
            var ctorName = utils.lookupThreeConstructorName(obj) + 'Model';
            var index = require('../');
            var ctor = index[ctorName];
            // Create the model
            var modelPromise = utils.createModel(ctor, this.widget_manager, obj);
            return modelPromise;
        }, this));
    },

    // For subclasses to retrieve list of propNames for (immutable) constructor args
    getConstructorArgNames: function() {
        return [];
    },

    //
    // Data-binding methods for syncing between model and three.js object
    //

    onChange: function(model, options) {
        if (options !== 'pushFromThree') {
            this.syncToGeoJSObj();
            // Also sync back out any generated properties:
            this.syncToModel();
        }
    },

    onChildChanged: function(model) {
        console.debug('child changed: ' + model.model_id);
        // Propagate up hierarchy:
        this.trigger('childchange', this);
    },

    processNewObj: function(obj) {

        obj.ipymodelId = this.model_id; // brand that sucker
        obj.ipymodel = this;

        this.obj = obj;
        return obj;
    },

    setupListeners: function() {

        // Handle changes in three instance props
        this.geojs_properties.forEach(function(propName) {
            // register listener for current child value
            var curValue = this.get(propName);
            if (curValue) {
                this.listenTo(curValue, 'change', this.onChildChanged.bind(this));
                this.listenTo(curValue, 'childchange', this.onChildChanged.bind(this));
            }

            // make sure to (un)hook listeners when child points to new object
            this.on('change:' + propName, function(model, value) {
                var prevModel = this.previous(propName);
                var currModel = value;
                if (prevModel) {
                    this.stopListening(prevModel);
                }
                if (currModel) {
                    this.listenTo(currModel, 'change', this.onChildChanged.bind(this));
                    this.listenTo(currModel, 'childchange', this.onChildChanged.bind(this));
                }
            }, this);
        }, this);

        // Handle changes in three instance nested props (arrays/dicts, possibly nested)
        listenNested(this, this.geojs_nested_properties, this.onChildChanged.bind(this));

        // Handle changes in data widgets/union properties
        this.datawidget_properties.forEach(function(propName) {
            dataserializers.listenToUnion(this, propName, this.onChildChanged.bind(this), false);
        }, this);

        this.on('change', this.onChange, this);
        this.on('msg:custom', this.onCustomMessage, this);

    },

    // push data from model to geojs object
    syncToGeoJSObj: function(force) {
            // console.log('property_assigners:');
            // console.dir(this.property_assigners);
            console.debug(`${this.constructor.model_name} syncToGeoJSObj(), obj:`);

        _.each(this.property_converters, function(converterName, propName) {
            // console.log(`converterName ${converterName}, propName ${propName}`)
            if (!force && !this.hasChanged(propName)) {
                // Only set changed properties unless forced
                return;
            }
            var assigner = this[this.property_assigners[propName]] || this.assignDirect;
            assigner = assigner.bind(this);
            if (!converterName) {
                assigner(this.obj, propName, this.get(propName));
                return;
            }

            converterName = converterName + 'ModelToThree';
            var converterFn = this[converterName];
            if (!converterFn) {
                throw new Error('invalid converter name: ' + converterName);
            }
            assigner(this.obj, propName, converterFn.bind(this)(this.get(propName), propName));
        }, this);

        // mappers are used for more complicated conversions between model and three props
        // see: DataTexture
        _.each(this.property_mappers, function(mapperName) {
            if (!mapperName) {
                throw new Error('invalid mapper name: ' + mapperName);
            }

            mapperName = mapperName + 'ModelToThree';
            var mapperFn = this[mapperName];
            if (!mapperFn) {
                throw new Error('invalid mapper name: ' + mapperName);
            }

            mapperFn.bind(this)();
        }, this);
    },


    // push data from geojs object to model
    syncToModel: function(syncAllProps) {

        syncAllProps = syncAllProps === null ? false : syncAllProps;

        // Collect all the keys to set in one go
        var toSet = {};

        _.each(this.property_converters, function(converterName, propName) {
            // console.log(`converterName ${converterName}, propName ${propName}`)
            if (!syncAllProps && !(propName in this.props_created_by_geojs)) {
                if (this.initialized_from_geojs[propName]) {
                    delete this.initialized_from_geojs[propName];
                } else {
                    return;
                }
            }

            if ((!converterName && (this.obj[propName]) instanceof Function)) {
            // if (!converterName) {
            //     if (typeof this.obj[propName] != 'function') {
            //         console.log(`${propName} is not a function`);
            //         return
            //     }
                toSet[propName] = this.obj[propName]();
                return;
            }

            converterName = converterName + 'ThreeToModel';
            var converterFn = this[converterName];
            if (!converterFn) {
                // DO NOT REMOVE NEXT LINE without talking to johnt first.
                // It's borderline madness, but removing this exception breaks
                // point features, and who knows what else. Sure wish I knew why...
                // The breaking logic (chaning it to a warning) follows:
                throw new Error(`invalid converter name ${converterName} for prop ${propName}`);
                // console.warn(`invalid converter name ${converterName} for prop ${propName}`);
                // return;
            }

            toSet[propName] = converterFn.bind(this)(this.obj[propName], propName);
        }, this);

        // console.log('toSet:');
        // console.dir(toSet);
        if (toSet) {
            // Apply all direct changes at once
            this.set(toSet, 'pushFromGeoJS');
        }

        // mappers are used for more complicated conversions between model and geojs props
        // see: DataTexture
        _.each(this.property_mappers, function(mapperName, dataKey) {
            if (!mapperName) {
                throw new Error('invalid mapper name: ' + mapperName);
            }

            mapperName = mapperName + 'ThreeToModel';
            var mapperFn = this[mapperName];
            if (!mapperFn) {
                throw new Error('invalid mapper name: ' + mapperName);
            }

            mapperFn.bind(this)(dataKey);
        }, this);

        this.save_changes();
    },


    //
    // Conversions
    //

    assignDirect: function(obj, key, value) {
        // For some reason, obj is undefined at least sometimes...
        if (!obj) {
            console.log(`model ${this.constructor.model_name}, obj ${obj}, key ${key}, value ${value}, typeof ${typeof obj[key]}`);
            return;
        }
        if (typeof obj[key] == 'function') {
            obj[key](value);
        }
        else {
            console.log(`model ${this.constructor.model_name}, obj ${obj}, key ${key}, value ${value}, typeof ${typeof obj[key]}`);
            obj[key] = value;
        }
    },

    /**
     * Check if array exists, if so replace content. Otherwise assign value.
     */
    assignArray: function(obj, key, value) {
        // For some reason, obj is undefined sometimes (wish I knew why)

        // if (key == 'data' || key == 'position') {
        //     console.log(`key = ${key}, value ${value} :`);
        //     console.dir(value);
        //     console.log('object:');
        //     console.dir(obj);
        // }

        // // Special handling for position
        // if (key == 'position' && value.length < 1) {
        //     console.debug('Skipping position assignment');
        //     return;
        // }

        if (!obj) {
            return;
        }
        if (!obj[key]) {
            console.warn(`obj[key] undefined for object type ${typeof obj}, key ${key}`)
            return;
        }

        if (typeof obj[key] == 'function') {
            obj[key](value);
            return
        }

        var existing = obj[key];
        if (!existing.splice) {
            console.warn(`obj[key].splice undefined for object type ${typeof obj}, key ${key}`);
            console.dir(existing);
            return;
        }
        if (existing !== null && existing !== undefined) {
            // existing.splice(0, existing.length, ...value);
            existing.splice.apply(existing, [0, existing.length].concat(value));
        } else {
            obj[key] = value;
        }
    },

    // Float
    convertFloatModelToThree: function(v) {
        if (typeof v === 'string' || v instanceof String) {
            v = v.toLowerCase();
            if (v === 'inf') {
                return Infinity;
            } else if (v === '-inf') {
                return -Infinity;
            } else if (v === 'nan') {
                return NaN;
            }
        }
        return v;
    },

    convertFloatThreeToModel: function(v) {
        if (isFinite(v)) { // Most common first
            return v;
        } else if (isNaN(v)) {
            return 'nan';
        } else if (v === Infinity) {
            return 'inf';
        } else if (v === -Infinity) {
            return '-inf';
        }
        return v;
    },

    // Bool
    convertBoolModelToThree: function(v) {
        return v;
    },

    convertBoolThreeToModel: function(v) {
        if (v === null) {
            return null;
        }
        // Coerce falsy/truthy:
        return !!v;
    },

    // Enum
    convertEnumModelToThree: function(e) {
        if (e === null) {
            return null;
        }
        return THREE[e];
    },

    convertEnumThreeToModel: function(e, propName) {
        if (e === null) {
            return null;
        }
        var enumType = this.enum_property_types[propName];
        var enumValues = Enums[enumType];
        var enumValueName = enumValues[e];
        return enumValueName;
    },

    // Vectors
    convertVectorModelToThree: function(v) {
        var result;
        switch(v.length) {
        case 2: result = new THREE.Vector2(); break;
        case 3: result = new THREE.Vector3(); break;
        case 4: result = new THREE.Vector4(); break;
        default:
            throw new Error('model vector has invalid length: ' + v.length);
        }
        result.fromArray(v);
        return result;
    },

    convertVectorThreeToModel: function(v) {
        return v.toArray();
    },

    assignVector: function(obj, key, value) {
        obj[key].copy(value);
    },

    // Euler
    convertEulerModelToThree: function(v) {
        return new THREE.Euler().fromArray(v);
    },

    convertEulerThreeToModel: function(v) {
        return v.toArray();
    },

    assignEuler: function(obj, key, value) {
        obj[key].copy(value);
    },

    // Vector Array
    convertVectorArrayModelToThree: function(varr, propName) {
        return varr.map(function(v) {
            return this.convertVectorModelToThree(v, propName);
        }, this);
    },

    convertVectorArrayThreeToModel: function(varr, propName) {
        return varr.map(function(v) {
            return this.convertVectorThreeToModel(v, propName);
        }, this);
    },

    // Color Array
    convertColorArrayModelToThree: function(carr, propName) {
        return carr.map(function(c) {
            return this.convertColorModelToThree(c, propName);
        }, this);
    },

    convertColorArrayThreeToModel: function(carr, propName) {
        return carr.map(function(c) {
            return this.convertColorThreeToModel(c, propName);
        }, this);
    },

    // Faces
    convertFaceModelToThree: function(f) {
        var normal = f[3];
        if (normal !== undefined && normal !== null) {
            if (Array.isArray(normal) && normal.length > 0 && Array.isArray(normal[0])) {
                normal = normal.map(function (value) {
                    return this.convertVectorModelToThree(value);
                }, this);
            } else {
                normal = this.convertVectorModelToThree(normal);
            }
        }
        var color = f[4];
        if (color !== undefined && color !== null) {
            if (Array.isArray(color)) {
                color = color.map(function (value) {
                    return new THREE.Color(value);
                }, this);
            } else {
                color = new THREE.Color(color);
            }
        }
        var result = new THREE.Face3(
            f[0],                                           // a
            f[1],                                           // b
            f[2],                                           // c
            normal,                                         // normal
            color,                                          // color
            f[5]                                            // materialIndex
        );

        return result;
    },

    convertFaceThreeToModel: function(f) {
        return [
            f.a,
            f.b,
            f.c,
            f.normal.toArray(),
            this.convertColorThreeToModel(f.color),
            f.materialIndex,
            this.convertVectorArrayThreeToModel(f.vertexNormals),
            this.convertColorArrayThreeToModel(f.vertexColors),
        ];
    },

    // Face Array
    convertFaceArrayModelToThree: function(farr, propName) {
        return farr.map(function(f) {
            return this.convertFaceModelToThree(f, propName);
        }, this);
    },

    convertFaceArrayThreeToModel: function(farr, propName) {
        return farr.map(function(f) {
            return this.convertFaceThreeToModel(f, propName);
        }, this);
    },

    // Matrices
    convertMatrixModelToThree: function(m) {
        var result;
        switch(m.length) {
        case 9: result = new THREE.Matrix3(); break;
        case 16: result = new THREE.Matrix4(); break;
        default:
            throw new Error('model matrix has invalid length: ' + m.length);
        }
        result.fromArray(m);
        return result;
    },

    convertMatrixThreeToModel: function(m) {
        return m.toArray();
    },

    assignMatrix: function(obj, key, value) {
        obj[key].copy(value);
    },

    // Functions
    convertFunctionModelToThree: function(fnStr) {
        var fn;
        eval('fn = ' + fnStr);
        return fn;
    },

    convertFunctionThreeToModelToThree: function(fn) {
        return fn.toString();
    },

    // ThreeType
    convertThreeTypeModelToThree: function(model) {
        if (model) {
            return model.obj;
        }
        return null;
    },

    convertThreeTypeThreeToModel: function(threeType) {
        if (!threeType) {
            return threeType;
        }
        return threeType.ipymodel;
    },

    // Dict
    assignDict: function(obj, key, value) {
        if (obj[key] === value) {
            // If instance equality, do nothing.
            return;
        }
        if (obj[key] === undefined || obj[key] === null) {
            if (value === null || value === undefined) {
                // Leave it as it is
                return;
            }
            obj[key] = {};
        }
        // Clear the dict
        Object.keys(obj[key]).forEach(function(k) {
            delete obj[key][k];
        });
        // Put in the new values
        Object.assign(obj[key], value);
    },

    assignStyle: function(obj, key, value) {
        // Assign item to object's style
        if (obj.style && {}.toString.call(obj.style) === '[object Function]') {
            obj.style(key, value);
        }
        else {
            console.warn(`obj type ${typeof obj} has no style method`);
        }
    },

    convertUniformDictModelToThree: function(modelDict) {
        if (modelDict === null) {
            return null;
        }
        // Convert any strings to THREE.Color
        // Just modify dict in-place, as it should serialize the same
        Object.keys(modelDict).forEach(function(k) {
            var value = modelDict[k].value;
            if (value && (typeof value === 'string' || value instanceof String)) {
                modelDict[k].value = new THREE.Color(value);
            }
        });
        return modelDict;
    },

    convertUniformDictThreeToModel: function(threeDict) {
        // No-op
        return threeDict;
    },

    // ThreeTypeArray
    convertThreeTypeArrayModelToThree: function(modelArr, propName) {
        if (!Array.isArray(modelArr)) {
            return this.convertThreeTypeModelToThree(modelArr, propName);
        }
        return modelArr.map(function(model) {
            return this.convertThreeTypeModelToThree(model, propName);
        }, this);
    },

    convertThreeTypeArrayThreeToModel: function(threeTypeArr, propName) {
        if (!Array.isArray(threeTypeArr)) {
            return this.convertThreeTypeThreeToModel(threeTypeArr, propName);
        }
        return threeTypeArr.map(function(threeType) {
            return this.convertThreeTypeThreeToModel(threeType, propName);
        }, this);
    },

    // ThreeTypeDict
    convertThreeTypeDictModelToThree: function(modelDict, propName) {
        return _.mapObject(modelDict, function(model) {
            return this.convertThreeTypeModelToThree(model, propName);
        }, this);
    },

    convertThreeTypeDictThreeToModel: function(threeTypeDict, propName) {
        return _.mapObject(threeTypeDict, function(threeType) {
            return this.convertThreeTypeThreeToModel(threeType, propName);
        }, this);
    },

    // BufferMorphAttributes
    convertMorphAttributesModelToThree: function(modelDict, propName) {
        return _.mapObject(modelDict, function(arr) {
            return arr.map(function(model) {
                return this.convertThreeTypeModelToThree(model, propName);
            }, this);
        }, this);
    },

    convertMorphAttributesThreeToModel: function(threeTypeDict, propName) {
        return _.mapObject(threeTypeDict, function(arr) {
            return arr.map(function(model) {
                return this.convertThreeTypeThreeToModel(model, propName);
            }, this);
        }, this);
    },

    // ArrayBuffer
    convertArrayBufferModelToThree: function(arr) {
        if (arr === null) {
            return null;
        }
        if (arr instanceof widgets.WidgetModel) {
            return arr.get('array').data;
        }
        return arr.data;
    },

    convertArrayBufferThreeToModel: function(arrBuffer) {
        if (arrBuffer === null) {
            return null;
        }
        // Never back-convert to a new widget
        return ndarray(arrBuffer);
    },

    // Color
    convertColorModelToThree: function(c) {
        if (c === null) {
            return null;
        }
        return new THREE.Color(c);
    },

    convertColorThreeToModel: function(c) {
        if (c === null) {
            return null;
        }
        return '#' + c.getHexString();
    },



});

// {
//     model_module: 'pygeojs',
//     model_name: 'sceneObjectModel',
//     model_module_version: EXTENSION_SPEC_VERSION,
// });

module.exports = {
    sceneObjectModel: sceneObjectModel,
};
