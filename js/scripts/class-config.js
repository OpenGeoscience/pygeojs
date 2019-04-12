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
            featureType:  new Types.String(''),  // internal
            layer_id:     new Types.String(''),  // internal

            // Todo fix bin, which was getting set to NaN for some reason
            // bin:          new Types.Float(null, {nullable:true}),
            data:         new Types.Array(),
            gcs:          new Types.String(null, {nullable:true}),
            // layer
            // renderer
            selectionAPI: new Types.Bool(false),
            //style:        new Types.Dict(),
            visible:      new Types.Bool(true),
        },
        //constructorArgs: ['bin', 'data', 'gcs', 'selectionAPI', 'style', 'visible'],
        constructorArgs: ['data', 'gcs', 'selectionAPI', 'visible'],
        propsDefinedByGeoJS: ['gcs'],
    },

    featureLayer: {
        superClass: 'layer',
        relativePath: './featureLayer',
        properties: {
            //features?
        },
    },

    layer: {
        relativePath: './layer',
        properties: {
            map_id:             new Types.String(''),  // internal use

            active:             new Types.Bool(true),
            annotations:        new Types.Array(),
            attribution:        new Types.String(null, {nullable: true}),
            // height
            //id:                 new Types.Int(null, {nullable: true}),
            // initialized
            name:               new Types.String(''),
            opacity:            new Types.Float(1.0),
            renderer:           new Types.String(null, {nullable: true}),
            rendererName:       new Types.String(null, {nullable: true}),
            selectionAPI:       new Types.Bool(true),
            sticky:             new Types.Bool(true),
            visible:            new Types.Bool(true),
            // width
            zIndex:             new Types.Int(null, {nullable: true}),
        },
        constructorArgs: ['active', 'annotations', 'attribution', 'name',
            'opacity', 'renderer', 'selectionAPI', 'sticky', 'visible', 'zIndex'],
        propsDefinedByGeoJS: ['attribution', 'rendererName', 'zIndex'],
    },

    lineFeature: {
        relativePath: './lineFeature',
        superClass: 'feature',
        // properties: {
        //     line:                new Types.VectorArray(),
        //     position:            new Types.VectorArray(),
        // },
        // constructorArgs: ['position'],
    },

    osmLayer: {
        superClass: 'tileLayer',
        relativePath: './osmLayer',
        properties: {
            mapOpacity: new Types.Float(null, {nullable:true, minValue:0.0, maxValue:1.0})
        },
        constructorArgs: ['mapOpacity'],
        propsDefinedByGeoJS: ['mapOpacity'],
    },

    pointFeature: {
        relativePath: './pointFeature',
        superClass: 'feature',
        properties: {
            clustering:          new Types.Bool(false),
            dynamicDraw:         new Types.Bool(false),
            position:            new Types.Array(),
            primitiveShape:      new Types.String('sprite'),
        },
        constructorArgs: ['clustering', 'dynamicDraw', 'position', 'primitiveShape'],
        propsDefinedByGeoJS: ['clustering', 'dynamicDraw', 'primitiveShape'],

    },

    polygonFeature: {
        relativePath: './polygonFeature',
        superClass: 'feature',
        // Todo handle position, which is optional to geojs,
        // but an empty array breaks things
        // properties: {
        //     position:            new Types.Array(),
        // },
        // constructorArgs: ['position'],
    },

    quadFeature: {
        relativePath: './quadFeature',
        superClass: 'feature',
        properties: {
            cacheQuads: new Types.Bool(true),
            color:      new Types.StyleString('#ffffff'),
            //image:      new Types.String(null, {nullable: true}),  // filename
            opacity:    new Types.StyleFloat(1.0, {nullable: true, minValue: 0.0, maxValue: 1.0})
        }
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
    }
}
