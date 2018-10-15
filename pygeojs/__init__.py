from ._version import version_info, __version__

from .scene import scene

def _jupyter_nbextension_paths():
    return [{
        'section': 'notebook',
        'src': 'static',
        'dest': 'pygeojs',
        'require': 'pygeojs/extension'
    }]
