'use strict';

const _ = require('underscore');
const path = require('path');
const fse = require('fs-extra');
const Glob = require('glob').Glob;
const Handlebars = require('handlebars');
const classConfigs = require('./class-config');
const Types = require('./prop-types.js');

const scriptDir = __dirname;
const baseDir = path.resolve(scriptDir, '..');

const jsSrcDir = path.resolve(baseDir, 'src/');
const pySrcDir = path.resolve(baseDir, '..', 'pygeojs');
//const docSrcDir = path.resolve(baseDir, '..', 'docs', 'source', 'api');
const templateDir = path.resolve(scriptDir, 'templates');

const geojsSrcDir = path.resolve(baseDir, 'node_modules', 'geojs', 'src');

const AUTOGEN_EXT = 'autogen';
const JS_AUTOGEN_EXT = '.' + AUTOGEN_EXT + '.js';

const IGNORE_FILES = [];
const CUSTOM_CLASSES = [];
const BASE_CLASSNAME = 'sceneObject';

//
// Templates
//

function compileTemplate(templateName) {
    templateName = path.basename(templateName, '.mustache');
    const templatePath = path.resolve(templateDir, templateName + '.mustache');
    return Handlebars.compile(fse.readFileSync(templatePath, {
        encoding: 'utf-8'
    }));
}

const jsWrapperTemplate      = compileTemplate('js_wrapper');
// const jsIndexTemplate        = compileTemplate('js_index');
const pyWrapperTemplate      = compileTemplate('py_wrapper');
// const pyTopLevelInitTemplate = compileTemplate('py_top_level_init');
// const docTemplate            = compileTemplate('autodoc');
// const docIndexTemplate       = compileTemplate('autodoc_index');

const pathSep = /\\|\//;

Handlebars.registerHelper('indent', function (data, indent) {
    const out = data.replace(/\n/g, '\n' + indent);
    return new Handlebars.SafeString(out);
});

Handlebars.registerHelper('rst', function (data, indent) {
    let out = data
        .replace(/\*/g, '\\*')
        .replace(/\[/g, '\\[')
        .replace(/\]/g, '\\]');
    if (indent) {
        out = out.replace(/\n/g, '\n' + indent);
    }
    return new Handlebars.SafeString(out);
});

//
// Helper Functions
//

function getClassConfig(className) {

    // console.log('getClassConfig: ' + className);
    className = className.replace(/\./g, '_');
    if (!(className in classConfigs)) {
        //throw new Error('invalid class name: ' + className);
        return null;
    }

    const curClass = classConfigs[className];

    const result = Object.assign({}, curClass);

    result.propsDefinedByThree = [];
    result.propsDefinedByThree = result.propsDefinedByThree.concat(curClass.propsDefinedByThree || []);

    // combine cur props with superclass properties for allProperties
    result.allProperties = {};
    result.properties = result.properties || {};
    if (curClass.superClass && curClass.superClass !== classConfigs._defaults.superClass) {
        const superClassConfig = getClassConfig(curClass.superClass);
        Object.assign(result.allProperties, superClassConfig.allProperties);

        result.propsDefinedByThree = result.propsDefinedByThree.concat(superClassConfig.propsDefinedByThree || []);
    }
    Object.assign(result.allProperties, curClass.properties);

    // we want to inherit all propsDefinedByThree

    // add defaults
    _.defaults(
        result,
        classConfigs._defaults
    );

    if ('type' in result.allProperties && result.allProperties.type instanceof Types.String) {
        if ('type' in result.properties) {
            result.properties.type.defaultValue = className;
        } else {
            result.properties.type = new Types.String(className);
            result.allProperties.type = result.properties.type;
        }
    }

    return result;
}

/**
 * Finds any extra class definitions in addition to the default one.
 *
 * E.g. SphereGeometry.js defines both SphereGeometry and SphereBufferGeometry.
 * Given that both are defined in the class config with the same relativePath,
 * this function returns an array of extra definitions for that file, i.e.
 * ['SphereBufferGeometry'] for an input of 'SphereGeometry' in the example.
 */
function getExtraDefines(className) {
    // className = className.replace(/\./g, '_');
    // if (!(className in classConfigs)) {
    //     throw new Error('invalid class name: ' + className);
    // }

    // const relativePath = classConfigs[className].relativePath;

    // const shared = [];
    // Object.keys(classConfigs).forEach(function(key) {
    //     if (key[0] === '_') {
    //         return; // continue
    //     }
    //     const config = classConfigs[key];
    //     if (config.relativePath === relativePath && key !== className) {
    //         shared.push(key);
    //     }
    // });
    // if (shared.length > 0) {
    //     console.log('extra defines found: ' + shared);
    // }
    // return shared;
}

function relativePathToPythonImportPath(relativePath) {

    let tokens = relativePath.split(pathSep);
    const firstToken = tokens[0];
    let sawFolderToken = false;

    if (tokens.length <= 0) { return '.'; }

    let result = '';
    if (firstToken === '.') {
        tokens = tokens.slice(1);
        result = '';
    } else if (firstToken === '..') {
        tokens = tokens.slice(1);
        result = '.';
    }

    tokens.forEach(function(token) {
        if (token === '.') {
            return;
        } else if (token === '..') {
            result += '.';
        } else {
            result += '.' + token;
            sawFolderToken = true;
        }

    });

    if (!sawFolderToken) { result += '.'; }

    return result;
}


//
// Javascript wrapper writer
//

class JavascriptWrapper {

    constructor(modulePath, className) {

        this.jsDestPath = path.resolve(jsSrcDir, modulePath);
        this.destDir = path.dirname(this.jsDestPath);
        this.relativePathToBase = path.relative(this.destDir, jsSrcDir);

        this.jsAutoDestPath = path.resolve(
            this.destDir,
            path.basename(this.jsDestPath, '.js') + '.' + AUTOGEN_EXT + '.js');

        if (className) {
            this.className = className;
            this.jsAutoDestPath = path.resolve(
                path.dirname(this.jsAutoDestPath),
                className + '.' + AUTOGEN_EXT + '.js');
        } else {
            this.className = path.basename(modulePath, '.js').replace(/\./g, '_');
            const extraDefines = getExtraDefines(this.className);
            extraDefines.forEach(function(extraClassName) {
                createJavascriptWrapper(modulePath, extraClassName);
            });
        }

        this.config = getClassConfig(this.className);

        this.modelName = this.className + 'Model';

        // check if manual file exists
        const customSrcPath = path.join(path.dirname(this.jsDestPath), path.basename(this.jsDestPath, '.js') + '.js');
        this.hasOverride = fse.existsSync(customSrcPath);

        this.processSuperClass();
        this.processDependencies();
        this.processProperties();
        this.processConstructorArgs();
        this.processOverrideClass();

        // Template and context
        this.template = jsWrapperTemplate;
        this.context = {
            now: new Date(),
            generatorScriptName: path.basename(__filename),

            className: this.className,
            viewName: this.viewName,
            modelName: this.modelName,
            superClass: this.superClass,
            constructor: {
                args: this.constructorArgs,
            },
            properties: this.properties,
            dependencies: this.dependencies,
            props_created_by_three: this.config.propsDefinedByThree,
            serialized_props: this.serializedProps,
            enum_properties: this.enum_properties,
            override_class: this.overrideClass, // { relativePath }
        };

        // Render template
        this.output = this.template(this.context);

    }

    getRequireInfoFromClassDescriptor(classDescriptor) {

        const result = {};

        if (typeof classDescriptor === 'string') {

            if (classDescriptor in classConfigs) {
                const config = getClassConfig(classDescriptor);
                result.className = classDescriptor;
                result.relativePath = config.relativePath;
            } else {
                result.className = path.basename(classDescriptor, '.js');
                result.relativePath = classDescriptor;
            }

        } else {
            throw new Error('invalid classDescriptor: ' + classDescriptor);
        }

        result.modelName = result.className + 'Model';

        result.absolutePath = path.resolve(jsSrcDir, result.relativePath);
        let absPath = result.absolutePath;
        if (fse.existsSync(absPath + '.js')) {
            absPath += '.js';
        } else {
            absPath += JS_AUTOGEN_EXT;
        }
        result.requirePath = path.relative(this.destDir, absPath).replace(/\\/g, '/');
        if (result.requirePath.charAt(0) !== '.') {
            result.requirePath = './' + result.requirePath;
        }

        return result;

    }

    processSuperClass() {

        this.superClass = this.getRequireInfoFromClassDescriptor(this.config.superClass);

    }

    processDependencies() {

        const dependencies = {};

        // process explicitly listed dependencies
        _.reduce(this.config.dependencies, function(result, depName) {

            result[depName] = this.getRequireInfoFromClassDescriptor(depName);
            return result;

        }, dependencies, this);

        // infer dependencies from any properties that reference other Three types
        _.reduce(this.config.properties, function(result, prop) {

            if (prop instanceof Types.ThreeType || prop instanceof Types.InitializedThreeType ||
                    prop instanceof Types.ThreeTypeArray || prop instanceof Types.ThreeTypeDict) {
                if (prop.typeName !== 'this') {
                    if (typeof prop.typeName === 'string') {
                        let typeName = prop.typeName || './_base/Three';
                        result[typeName] = this.getRequireInfoFromClassDescriptor(typeName);
                    } else if (prop.typeName instanceof Array) {
                        prop.typeName.forEach(function(typeName) {
                            result[typeName] = this.getRequireInfoFromClassDescriptor(typeName);
                        }, this);
                    }
                }
            }
            return result;

        }, dependencies, this);

        this.dependencies = dependencies;

    }

    processProperties() {

        this.properties = _.mapObject(this.config.properties, function(prop) {

            return {
                defaultJson: prop.getJSPropertyValue(),
                property_array_name: prop.getPropArrayName(),
                property_converter: prop.getPropertyConverterFn(),
                property_assigner: prop.getPropertyAssignmentFn(),
            };

        }, this);

        this.serializedProps = _.mapObject(
            _.pick(this.config.properties,
                function(prop) {
                    return !!prop.serializer;
                }),
            function(prop) {
                return prop.serializer;
            }, {});

        this.enum_properties = _.reduce(this.config.properties, function(result, prop, propName) {
            if (prop.enumTypeName) {
                result[propName] = prop.enumTypeName;
            }
            return result;
        }, {});

    }

    processConstructorArgs() {

        function getConstructorParametersObject() {
            let result = [ '{' ];

            result = result.concat(_.keys(this.config.properties).map(function(propName) {
                return '                ' + propName + ': ' + this.getModelToThreeGetter(propName) + ',';
            }, this));

            result.push('            }');
            return result;
        }

        const constructorArgs = this.config.constructorArgs.map(function(propName) {
            if (propName === 'parameters') {
                return getConstructorParametersObject.bind(this)().join('\n');
            } else {
                return this.getModelToThreeGetter(propName);
            }
        }, this);

        this.constructorArgs = constructorArgs;

    }

    processOverrideClass() {

        if (!this.hasOverride) {
            return;
        }

        console.log('JS override exists for ' + this.className);

        const overrideModule = 'Override';
        const overrideModel = overrideModule + '.' + this.modelClass;

        this.overrideClass = {
            relativePath: './' + this.className + '.js',
            modelName: overrideModel,
        };

    }

    getModelToThreeGetter(propName) {
        const prop = this.config.allProperties[propName];
        if (!prop) {
            throw new Error('invalid propName: ' + propName);
        }
        const converter = prop.getPropertyConverterFn();
        if (converter) {
            return 'this.' + converter +  'ModelToThree(this.get(\'' + propName + '\'), \'' + propName +'\')';
        } else {
            return 'this.get(\'' + propName + '\')';
        }
    }

    getOutputFilename() {
        return this.jsAutoDestPath;
    }

}


function createJavascriptWrapper(modulePath, className) {

    let wrapper;
    try {
        wrapper = new JavascriptWrapper(modulePath, className);
    } catch (e) {
        console.log('error creating wrapper: ');
        console.log(e);
        console.log('skipping: ' + modulePath + (className ? ':' + className : ''));
        return Promise.resolve(false);
    }
    return fse.outputFile(wrapper.getOutputFilename(), wrapper.output);

    // NOTE: Old implementation
    // const wrapper = new JavascriptWrapper(modulePath);
    // return wrapper.writeOutFile();

}


function writeJavascriptIndexFiles() {

    console.log('Writing javascript indices...');

    const excludes = [
        /\.swp$/,
        /\.DS_Store$/,
        /index\.js$/,
        './embed.js',
        './extension.js',
    ];

    // Regexp's
    const RE_AUTOGEN_EXT = /\.autogen\.js$/;

    function writeIndexForDir(dirPath, isTopLevel) {

        const dirAbsPath = path.resolve(jsSrcDir, dirPath);

        // Generate list of files in dir to include in index.js as require lines
        return fse.readdir(dirAbsPath).then(function(dirFiles) {

            // get proper relative path for file
            dirFiles = dirFiles.map(function(filename) {
                return './' + path.join(dirPath, filename);
            });

            // filter excluded files
            dirFiles = dirFiles.filter(function(filePath) {

                // ignore autogen files in _base dir
                if (/_base/.test(dirPath) && RE_AUTOGEN_EXT.test(filePath)) {
                    return false;
                }

                // compare filePath to each exclude pattern
                const shouldExclude = _.any(excludes, function(testPattern) {
                    if (testPattern instanceof RegExp) {
                        return testPattern.test(filePath);
                    } else if (typeof testPattern === 'string') {
                        return testPattern === filePath;
                    }
                });
                if (shouldExclude) {
                    return false;
                }

                // if override class exists, load it in favor of the autogen file
                // e.g. for WebGLRenderer.js, Object3D.js, DataTexture.js
                // override classes should extend the autogen versions
                if (RE_AUTOGEN_EXT.test(filePath)) {

                    const dirname = path.dirname(filePath);
                    const basename = path.basename(filePath, JS_AUTOGEN_EXT);
                    const overrideName = basename + '.js';
                    const overridePath = './' + path.join(dirname, overrideName);

                    // override file present, so don't include autogen file in index
                    if (dirFiles.indexOf(overridePath) > -1) {
                        console.log('override exists for: ' + filePath);
                        return false;
                    }

                }

                return true;
            });

            // convert file paths relative to js src dir to paths relative to dirPath
            dirFiles = dirFiles.map(function(filePath) {
                return './' + path.basename(filePath);
            });

            // render template
            const context = {
                now: new Date(),
                generatorScriptName: path.basename(__filename),
                top_level: isTopLevel,
                submodules: dirFiles,
            };
            const output = jsIndexTemplate(context);
            const outputPath = path.resolve(jsSrcDir, dirPath, 'index.js');

            return fse.outputFile(outputPath, output);

        });
    }

    // map over all directories in js src dir
    return mapPromiseFnOverGlob(
        '**/', // trailing slash globs for dirs only
        function(dirPath) {
            return writeIndexForDir(dirPath, false);
        },
        { cwd: jsSrcDir, }
    ).then(function() {
        // write top-level index (not included in above glob)
        return writeIndexForDir('.', true);
    });

}


//
// Python wrapper writer
//

class PythonWrapper {

    constructor(modulePath, className) {
        //console.log(`PythonWrapper constructor for modulePath ${modulePath}, className ${className}`)
        this.modulePath = modulePath;
        this.dirRelativePath = path.dirname(modulePath);
        this.destDirAbsolutePath = path.resolve(pySrcDir, this.dirRelativePath);
        this.destDirRelativeToBase = path.relative(this.destDirAbsolutePath, pySrcDir);

        this.basename = path.basename(modulePath, '.js');

        // if (className) {
        //     this.className = className;
        // } else {
        //     this.className = this.basename.replace(/\./g, '_');
        //     const extraDefines = getExtraDefines(this.className);
        //     extraDefines.forEach(function(extraClassName) {
        //         createPythonWrapper(modulePath, extraClassName);
        //     });
        // }
        this.className = this.basename;

        this.pyDestPath = path.resolve(this.destDirAbsolutePath, this.className + '.py');
        this.pyAutoDestPath = path.resolve(this.destDirAbsolutePath, this.className + '_' + AUTOGEN_EXT + '.py');

        this.pyBaseRelativePath = path.relative(this.destDirAbsolutePath, pySrcDir);
        this.pyBaseRelativePath = relativePathToPythonImportPath(this.pyBaseRelativePath);

        // check if manual file exists
        this.hasOverride = fse.existsSync(this.pyDestPath);

        this.isCustom = CUSTOM_CLASSES.indexOf(modulePath) !== -1;

        this.hasParameters = false;

        this.config = getClassConfig(this.className);

        this.processSuperClass();
        this.processDependencies();
        this.processProperties();
        this.processDocsUrl();
        this.processConstructorArgs();

        // Template and context
        this.context = {
            now: new Date(),
            generatorScriptName: path.basename(__filename),
            threejs_docs_url: this.docsUrl,
            py_base_relative_path: this.pyBaseRelativePath,
            constructor: {
                args: this.constructorArgs,
                hasParameters: this.hasParameters,
            },

            className: this.className,
            modelName: this.className + 'Model',
            superClass: this.superClass,
            properties: this.properties,
            dependencies: this.dependencies,
            hasOverride: this.hasOverride,
            isCustom: this.isCustom,
        };

        // Render template
        this.output = pyWrapperTemplate(this.context);

    }

    getRequireInfoFromClassDescriptor(classDescriptor) {

        const result = {};

        if (typeof classDescriptor === 'string') {

            if (classDescriptor in classConfigs) {
                const config = getClassConfig(classDescriptor);
                result.className = classDescriptor;
                result.relativePath = config.relativePath;
            } else {
                result.className = path.basename(classDescriptor, '.js');
                result.relativePath = classDescriptor;
            }

        } else {
            throw new Error('invalid classDescriptor: ' + classDescriptor);
        }

        // get path of dependency relative to module dir
        result.absolutePath = path.resolve(pySrcDir, result.relativePath);

        if (!fse.existsSync(result.absolutePath + '.py')) {
            result.absolutePath += '_' + AUTOGEN_EXT;
        }

        result.requirePath = path.relative(this.destDirAbsolutePath, result.absolutePath);
        result.pyRelativePath = relativePathToPythonImportPath(result.requirePath);

        return result;

    }

    processSuperClass() {

        this.superClass = this.getRequireInfoFromClassDescriptor(this.config.superClass);

        if (this.superClass.className === 'Three') {
            this.superClass.className = 'ThreeWidget';
        }
    }

    processDependencies() {

        const dependencies = {};

        // process explicitly listed dependencies
        _.reduce(this.config.dependencies, function(result, depName) {

            result[depName] = this.getRequireInfoFromClassDescriptor(depName);
            return result;

        }, dependencies, this);

        // infer dependencies from any properties that reference other Three types
        _.reduce(this.config.properties, function(result, prop) {

            if (prop instanceof Types.ThreeType || prop instanceof Types.InitializedThreeType ||
                    prop instanceof Types.ThreeTypeArray || prop instanceof Types.ThreeTypeDict) {
                if (prop.typeName !== 'this') {
                    if (typeof prop.typeName === 'string') {
                        let typeName = prop.typeName || './_base/Three';
                        result[typeName] = this.getRequireInfoFromClassDescriptor(typeName);
                        if (result[typeName].className === 'Three') {
                            result[typeName].className = 'ThreeWidget';
                        }
                    } else if (prop.typeName instanceof Array) {
                        prop.typeName.forEach(function(typeName) {
                            result[typeName] = this.getRequireInfoFromClassDescriptor(typeName);
                        }, this);
                    }
                }
            }
            return result;

        }, dependencies, this);

        this.dependencies = dependencies;

    }

    processProperties() {

        this.properties = _.mapObject(this.config.properties, function(prop) {
            return {
                help: prop.options.help,
                trait_declaration: prop.getTraitlet(),
                defaultJson: prop.getPythonDefaultValue(),
            };
        }, this);

    }

    processConstructorArgs() {
        this.constructorArgs = this.config.constructorArgs.map(function(propName) {
            // Currently, we don't generate an __init__ method for classes that use the parameters
            // constructor arg
            if (propName === 'parameters') {
                this.hasParameters = true;
                return {
                    name: propName,
                    prop: {
                        defaultJson: '{}',
                    }
                };
            }
            return {
                name: propName,
                prop: {
                    defaultJson: this.config.allProperties[propName].getPythonDefaultValue(),
                }
            };
        }, this);
    }

    processDocsUrl() {

        if (this.isCustom) {
            this.docsUrl = null;
        }

        const refTokens = this.modulePath.split(pathSep);

        // strip extension off filename
        refTokens[refTokens.length - 1] = path.basename(refTokens[refTokens.length - 1], '.js');

        let refUrl = 'https://threejs.org/docs/#api/' + refTokens.join('/');

        // combine middle elements of url with dot
        refUrl = refUrl.replace('Renderers/WebGL/Plugins/', 'Renderers.WebGL.Plugins/');
        refUrl = refUrl.replace('Renderers/WebGL/', 'Renderers.WebGL/');
        refUrl = refUrl.replace('Renderers/Shaders/', 'Renderers.Shaders/');
        refUrl = refUrl.replace('Extras/Animation/', 'Extras.Animation/');
        refUrl = refUrl.replace('Extras/Core/', 'Extras.Core/');
        refUrl = refUrl.replace('Extras/Curves/', 'Extras.Curves/');
        refUrl = refUrl.replace('Extras/Geometries/', 'Extras.Geometries/');
        refUrl = refUrl.replace('Extras/Helpers/', 'Extras.Helpers/');
        refUrl = refUrl.replace('Extras/Objects/', 'Extras.Objects/');

        this.docsUrl = refUrl;

    }

    getOutputFilename() {
        return this.pyAutoDestPath;
    }

    getDocFilename() {
        return path.resolve(docSrcDir, this.dirRelativePath, `${this.className}_autogen.rst`);
    }

    getDocOutput() {
        return docTemplate(this.context);
    }
}

// Execute a function for each match to a glob query
//
// Parameters:
//   globPattern: String glob pattern for node-glob
//   mapFn:       Function function(pathRelativeToCwd), should return a promise or list of promises
//   globOptions: Object of options passed directly to node-glob
//
// Returns: Promise that resolves with array of results from mapFn applies to all glob matches
function mapPromiseFnOverGlob(globPattern, mapFn, globOptions) {

    return new Promise(function(resolve, reject) {

        let promises = [];
        let result;

        // trailing slash will match only directories
        new Glob(globPattern, globOptions)
            .on('match', function(match) {
                //console.log(`match: ${match}`);

                // Skip classes not in config
                let baseName = path.basename(match, '.js');
                if (!(baseName in classConfigs)) {
                  return;
                }

                console.log(`match class ${baseName}`);
                result = mapFn(match, baseName);
                if (result instanceof Array) {
                    promises = promises.concat(result);
                } else {
                    promises.push(result);
                }

            })
            .on('end', function() {
                // wait for all file ops to finish
                Promise.all(promises).then(resolve).catch(reject);
            })
            .on('error', function(err) {
                reject(err);
            })
            .on('abort', function() {
                reject(new Error('Aborted'));
            });

    });

}

function mapPromiseFnOverFileList(fileList, mapFn) {
    let promises = [];

    fileList.forEach(function(filePath) {
        const result = mapFn(filePath);
        if (result instanceof Array) {
            promises = promises.concat(result);
        } else {
            promises.push(result);
        }
    }, this);

    return Promise.all(promises);
}

function mapPromiseFnOverModules(mapFn) {
    return mapPromiseFnOverGlob('*.js', mapFn, {
        cwd: geojsSrcDir,
        nodir: true ,
        ignore: IGNORE_FILES,
    });
}

function createPythonWrapper(modulePath, className) {
    let wrapper;
    try {
        wrapper = new PythonWrapper(modulePath, className);
    } catch (e) {
        console.log(e);
        console.log('skipping: ' + modulePath + (className ? ':' + className : ''));
        return Promise.resolve(false);
    }
    let fname = wrapper.getOutputFilename();
    let pyPromise = fse.outputFile(fname, wrapper.output);

    return pyPromise;
/*
    // Also output documentation for the Python API
    let docfname = wrapper.getDocFilename();
    //console.log(docfname);
    //let docPromise = Promise.resolve();
    let docPromise = fse.outputFile(docfname, wrapper.getDocOutput());

    return Promise.all([pyPromise, docPromise]);
*/
}

function createJavascriptFiles() {
    return mapPromiseFnOverModules(createJavascriptWrapper)
        // .then(function() {
        //     return mapPromiseFnOverFileList(CUSTOM_CLASSES, createJavascriptWrapper);
        // })
        // .then(function() {
        //     return writeJavascriptIndexFiles();
        // });
}


function createPythonFiles() {
    // Prevent python file generation when outside dir (e.g. npm install in dependent)
    if (!fse.existsSync(pySrcDir)) {
      console.log(`Skip autogen because ${pySrcDir} does not exist`);
        return Promise.resolve();
    }

    return mapPromiseFnOverModules(
        function(relativePath, className) {
            return createPythonWrapper(relativePath, className);
        //     return createPythonWrapper(relativePath).then(function() {
        //         // ensures each dir has empty __init__.py file for proper importing of sub dirs
        //         return createPythonModuleInitFile(relativePath);
        //     });
        // })
        // .then(function() {
        //     return mapPromiseFnOverFileList(CUSTOM_CLASSES, function(relativePath) {
        //         return createPythonWrapper(relativePath).then(function() {
        //             // ensures each dir has empty __init__.py file for proper importing of sub dirs
        //             return createPythonModuleInitFile(relativePath);
        //         });
        //     });
        // })
        // .then(function() {
        //     // Manually ensure base init file is created
        //     return createPythonModuleInitFile('_base/__init__');
        // })
        // .then(function() {
        //     return writeDocModuleFiles();
        // })
        // .then(function() {
        //     // top level __init__.py file imports *all* pythreejs modules into namespace
        //     return createTopLevelPythonModuleFile();
        });
}

function generateFiles() {
    return Promise.all([
        createJavascriptFiles(),
        createPythonFiles(),
    ]);
}

if (require.main === module) {
    generateFiles().then(function() {
        console.log('DONE');
    });
}
