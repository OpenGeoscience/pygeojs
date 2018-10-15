from ._version import version_info, __version__

from .example import *

from .map import geomap

def _jupyter_nbextension_paths():
    return [{
        'section': 'notebook',
        'src': 'static',
        'dest': 'pygeojs',
        'require': 'pygeojs/extension'
    }]
