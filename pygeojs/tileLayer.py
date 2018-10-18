import six
from ipywidgets import Widget, DOMWidget, widget_serialization, Color, register
from traitlets import (
    Unicode, Int, CInt, Instance, ForwardDeclaredInstance, This, Enum,
    Tuple, List, Dict, Float, CFloat, Bool, Union, Any,
    )

from .tileLayer_autogen import tileLayer as tileLayerBase


#@register
class tileLayer(tileLayerBase):
    """tileLayer

    Manually generated because parameters are read_only, which isn't handled in widget
    """

    def __init__(self, map_id='', animationDuration=0, baseUrl=None, cacheSize=400, imgFormat="png", keepLower=True, maxLevel=18, minLevel=0, tileHeight=256, tileWidth=256, topDown=False, url=None, wrapX=True, wrapY=False, **kwargs):
        kwargs['map_id'] = map_id
        self.set_trait('animationDuration', animationDuration)
        self.set_trait('baseUrl', baseUrl)
        self.set_trait('cacheSize', cacheSize)
        self.set_trait('imgFormat', imgFormat)
        self.set_trait('keepLower', keepLower)
        self.set_trait('maxLevel', maxLevel)
        self.set_trait('minLevel', minLevel)
        self.set_trait('tileHeight', tileHeight)
        self.set_trait('tileWidth', tileWidth)
        self.set_trait('topDown', topDown)
        self.set_trait('url', url)
        self.set_trait('wrapX', wrapX)
        self.set_trait('wrapY', wrapY)
        super(tileLayer, self).__init__(**kwargs)

    _model_name = Unicode('tileLayerModel').tag(sync=True)

    # All tileLayer properties are constructor arguments only,
    # And all are optional, so for each:
    # - Set default value to None
    # - Set read_only flag

    animationDuration = CInt(None, allow_none=True, read_only=True).tag(sync=True)

    baseUrl = Unicode(None, allow_none=True, read_only=True).tag(sync=True)

    cacheSize = CInt(None, allow_none=True, read_only=True).tag(sync=True)

    imgFormat = Unicode(None, allow_none=True, read_only=True).tag(sync=True)

    keepLower = Bool(None, allow_none=True, read_only=True).tag(sync=True)

    maxLevel = CFloat(None, allow_none=True, read_only=True).tag(sync=True)

    minLevel = CFloat(None, allow_none=True, read_only=True).tag(sync=True)

    tileHeight = CInt(None, allow_none=True, read_only=True).tag(sync=True)

    tileWidth = CInt(None, allow_none=True, read_only=True).tag(sync=True)

    topDown = Bool(None, allow_none=True, read_only=True).tag(sync=True)

    url = Unicode(None, allow_none=True, read_only=True).tag(sync=True)

    wrapX = Bool(None, allow_none=True, read_only=True).tag(sync=True)

    wrapY = Bool(None, allow_none=True, read_only=True).tag(sync=True)


if six.PY3:
    import inspect
    # Include explicit signature since the metaclass screws it up
    tileLayer.__signature__ = inspect.signature(tileLayer.__init__)
