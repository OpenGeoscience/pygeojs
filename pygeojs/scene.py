import ipywidgets as widgets
import traitlets

from .featureLayer import featureLayer
from .osmLayer_autogen import osmLayer
from .tileLayer import tileLayer

@widgets.register
class scene(widgets.DOMWidget):
    """Widget representing GeoJS scene (map)"""
    _view_name =  traitlets.Unicode('sceneView').tag(sync=True)
    _model_name = traitlets.Unicode('sceneModel').tag(sync=True)
    _view_module = traitlets.Unicode('pygeojs').tag(sync=True)
    _model_module = traitlets.Unicode('pygeojs').tag(sync=True)
    _view_module_version = traitlets.Unicode('^0.1.0').tag(sync=True)
    _model_module_version = traitlets.Unicode('^0.1.0').tag(sync=True)

    allowRotation = traitlets.Bool(default_value=True).tag(sync=True)
    autoResize = traitlets.Bool(default_value=True).tag(sync=True)
    # bounds
    # camera
    center = traitlets.Dict(
        trait=traitlets.Float,default_value={'x': 0.0, 'y': 0.0}).tag(sync=True)
    clampBoundsX = traitlets.Bool(default_value=False).tag(sync=True)
    clampBoundsY = traitlets.Bool(default_value=True).tag(sync=True)
    clampZoom = traitlets.Bool(default_value=True).tag(sync=True)
    discreteZoom = traitlets.Bool(False).tag(sync=True)
    gcs = traitlets.Unicode('EPSG:3857').tag(sync=True)
    ingcs = traitlets.Unicode('EPSG:4326').tag(sync=True)
    # interactor
    #max = traitlets.Int(16).tag(sync=True)
    maxBounds = traitlets.Dict().tag(sync=True)
    #min = traitlets.Int(0).tag(sync=True)
    # origin
    # rotatedSize
    rotation = traitlets.Float(0.0).tag(sync=True)
    unitsPerPixel = traitlets.Int(156543).tag(sync=True)
    zoom = traitlets.Float(4).tag(sync=True)
    # zoomRagne
    # Not applicable: node, width, height, animationQueue(?)

    # Can this be local var?
    _layers = traitlets.Tuple().tag(sync=True, **widgets.widget_serialization)


    def createLayer(self, layer_type, **kwargs):
        if 'osm' == layer_type:
            layer = osmLayer(self.model_id, **kwargs)
        elif 'feature' == layer_type:
            layer = featureLayer(self.model_id, **kwargs)
        elif 'tile' == layer_type:
            layer = tileLayer(self.model_id, **kwargs)
        else:
            raise Exception(
                'Unrecognized layer type \"{}\"; You must specify layer_type as one of {osm, feature}'
                .format(layer_type))

        layer_list = list(self._layers)
        layer_list.append(layer)
        self._layers = tuple(layer_list)

        return layer

    @traitlets.default('layout')
    def _default_layout(self):
        return widgets.Layout(height='400px', align_self='stretch')
