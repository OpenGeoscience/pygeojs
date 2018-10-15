import six
import ipywidgets as widgets
import traitlets

from .featureLayer_autogen import featureLayer as featureLayerBase
from .pointFeature_autogen import pointFeature


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

    def createFeature(self, feature_type, data, **kwargs):
        print('In createFeature')
        feature = None
        if 'point' == feature_type:
            feature = pointFeature(**kwargs)
            feature._data = data

        if feature is not None:
            feature_list = list(self._features)
            feature_list.append(feature)
            self._features = tuple(feature_list)

        return feature


if six.PY3:
    import inspect
    # Include explicit signature since the metaclass screws it up
    featureLayer.__signature__ = inspect.signature(featureLayer.__init__)
