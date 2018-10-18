version_info = (0, 1, 2)
__version__ = ".".join(map(str, version_info))

from .scene import scene

def _jupyter_nbextension_paths():
    return [{
        'section': 'notebook',
        'src': 'static',
        'dest': 'pygeojs',
        'require': 'pygeojs/extension'
    }]
