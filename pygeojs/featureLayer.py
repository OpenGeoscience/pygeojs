import six
import ipywidgets as widgets
import traitlets

from .featureLayer_autogen import featureLayer as featureLayerBase
from .geojsonFeatureCollection import geojsonFeatureCollection
from .lineFeature_autogen import lineFeature
from .pointFeature_autogen import pointFeature
from .polygonFeature_autogen import polygonFeature


@widgets.register
class featureLayer(featureLayerBase):
    """featureLayer
    """

    # Do NOT specify in class-config.js (python error in jsonutils.js)
    _features = traitlets.Tuple().tag(sync=True, **widgets.widget_serialization)

    def __init__(self, **kwargs):
        super(featureLayer, self).__init__(**kwargs)

    def clear(self):
        self._features = ()

    def createFeature(self, feature_type, **kwargs):
        """"""
        # Even though layer_id is a keyword argument to the feature constructors, you
        # MUST provide layer_id, because it is needed to instantiate the feature
        # on the client (javascript) side.
        if 'line' == feature_type:
            feature = lineFeature(layer_id=self.model_id, featureType=feature_type, **kwargs)
        elif 'point' == feature_type:
            feature = pointFeature(layer_id=self.model_id, featureType=feature_type, **kwargs)
        elif 'polygon' == feature_type:
            feature = polygonFeature(layer_id=self.model_id, featureType=feature_type, **kwargs)
        else:
            raise Exception('Unrecognized feature type \"{}\"'.format(feature_type))

        feature_list = list(self._features)
        feature_list.append(feature)
        self._features = tuple(feature_list)

        return feature


    def readGeoJSON(self, data):
        """Reads geojson input and adds to current layer.

        :param data: Can be either string for filename (path) or URL,
            or python dictionary representing the feature collection.
        """
        # Don't add to feature list, because new features are
        # initialized by geojs not wrappers
        return geojsonFeatureCollection(self, data)


if six.PY3:
    import inspect
    # Include explicit signature since the metaclass screws it up
    featureLayer.__signature__ = inspect.signature(featureLayer.__init__)
