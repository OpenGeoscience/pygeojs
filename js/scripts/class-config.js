'use strict';

var Types = require('./prop-types');

module.exports = {

    _defaults: {
        superClass: 'sceneObject',
        // properties
        properties: { },
        // ordered list of string names of attributes required by constructor
        constructorArgs: [
            // e.g.: [ 'position', 'scale', 'rotation' ]
        ],
    },

    feature: {
        superClass: 'sceneObject',
        relativePath: './feature',
        properties: {
            _data:         new Types.Array(),

            bin:          new Types.Float(null, {nullable:true}),
            data:         new Types.Array(),
            gcs:          new Types.String(null, {nullable:true}),
            // layer
            // renderer
            selectionAPI: new Types.Bool(false),
            style:        new Types.Dict(),
            visible:      new Types.Bool(true),
        }
    },

    featureLayer: {
        superClass: 'layer',
        relativePath: './featureLayer',
        properties: {
            //features?
        },
        constructorArgs: ['map_id'],
    },

    layer: {
        relativePath: './layer',
        properties: {
            active:             new Types.Bool(true),
            annotations:        new Types.Array(),
            attribution:        new Types.String(null, {nullable: true}),
            // height
            //id:                 new Types.Int(null, {nullable: true}),
            // initialized
            map_id:             new Types.String(''),
            name:               new Types.String(''),
            opacity:            new Types.Float(1.0),
            // renderer
            // rendererName
            selectionAPI:       new Types.Bool(true),
            sticky:             new Types.Bool(true),
            visible:            new Types.Bool(true),
            // width
            zIndex:             new Types.Int(null, {nullable: true}),
        },
        constructorArgs: ['map_id'],
    },

    osmLayer: {
        superClass: 'tileLayer',
        relativePath: './osmLayer',
        properties: {
            mapOpacity: new Types.Float(null, {nullable:true, minValue:0.0, maxValue:1.0})
        },
        constructorArgs: ['map_id'],
    },

    pointFeature: {
        relativePath: './pointFeature',
        superClass: 'feature',
        properties: {
            // clustering
            dynamicDraw:         new Types.Bool(false),
            position:            new Types.Array(),
            primitiveShape:      new Types.String('sprite'),
            style:               new Types.Dict(),
        },

    },


    // Placeholder class for tileLayer.
    // Must subclass manually to handle immutable constructor args,
    // to avoid error in js widget.
    tileLayer: {
        superClass: 'featureLayer',
        relativePath: './tileLayer',
        properties: {
            // animationDuration: new Types.Int(null, {nullable: true}),
            // baseUrl:           new Types.String(null, {nullable: true}),
            // cacheSize:         new Types.Int(400, {nullable: true}),
            // imgFormat:         new Types.String('png', {nullable: true}),
            // keepLower:         new Types.Bool(true, {nullable: true}),
            // maxLevel:          new Types.Float(18, {nullable: true}),
            // minLevel:          new Types.Float(0, {nullable: true}),
            // // subdomain
            // // tileOverlap
            // tileHeight:        new Types.Int(256, {nullable: true}),
            // // tileMaxBounds
            // // tileOffset
            // // tileRounding
            // // tilesAtZoom
            // tileWidth:         new Types.Int(256, {nullable: true}),
            // topDown:           new Types.Bool(false, {nullable: true}),
            // //url:
            // wrapX:             new Types.Bool(true, {nullable: true}),
            // wrapY:             new Types.Bool(false, {nullable: true}),
        },
        constructorArgs: ['map_id']
        // ['map_id', 'animationDuration', 'attribution', 'baseUrl',
        //     'cacheSize', 'imgFormat', 'keepLower', 'maxLevel', 'minLevel',
        //     'tileHeight', 'tileWidth', 'topDown', 'wrapX', 'wrapY'
        // ],
    }
}
