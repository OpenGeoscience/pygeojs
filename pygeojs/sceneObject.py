import ipywidgets as widgets
import traitlets

@widgets.register
class sceneObject(widgets.CoreWidget):
    """Base widget for all geojs classes except map.

    Model only, because view/rendering is handled by the map instance
    """
    _model_module = traitlets.Unicode('pygeojs').tag(sync=True)
    _model_module_version = traitlets.Unicode('^0.1.0').tag(sync=True)
