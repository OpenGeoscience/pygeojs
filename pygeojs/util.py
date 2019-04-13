"""
Some utility functions for notebooks using pygeojs
"""

import base64
import json
import os
import urllib

def _lookup_mime(path):
    """Determines mime type from extension"""
    base,ext = os.path.splitext(path)
    if not ext:
        return None
    ext = ext.lower()
    mime_dict = {
        '.bmp': 'image/bmp',
        '.gif': 'image/gif',
        '.ico': 'image/vnd.microsoft.icon',
        '.jpeg': 'image/jpeg',
        '.jpg': 'image/jpeg',
        '.png': 'image/png',
        '.svg': 'image/svg+xml',
        '.webp': 'image/webp'
    }
    # (Left off image/tiff because no browser support)
    return mime_dict.get(ext)


def img2base64(source, mime=None):
    """Loads image file and generates/returns base64 encoding

    Intended for loading image files and getting base64 string for
    drawing on quad features.
    @param source: (string) either filesystem path or web url
    @param mime: (string) mimetype; must be provded for urls
    """
    path = None
    url = None

    # Is the source a URL?
    p = urllib.parse.urlparse(source)
    if p.scheme == 'file':
        path = os.path.abspath(os.path.join(p.netloc, p.path))
    elif bool(p.scheme) and bool(p.netloc):
        url = source
        path = p.path
    else:
        path = source

    if mime is None:
        mime = _lookup_mime(path)

    if mime is None:
      raise RuntimeError('Unable to determine mime type for \"{}\"'.format(source))

    raw_data = None

    if url is not None:
        from urllib.request import Request, urlopen
        req = Request(url)
        response = urlopen(req)
        raw_data = response.read()
    else:
        with open(path, 'rb') as fp:
            raw_data = fp.read()

    if raw_data is None:
        raise RuntimeError('Failed to load \"{}\"'.format(source))

    # Generate base64 string
    encoded_bytes = base64.b64encode(raw_data)
    prefix = 'data:{};base64,'.format(mime)
    encoded_data = prefix + encoded_bytes.decode('ascii')
    return encoded_data

def get_tiles_url(girder_url, item_id, mapnik_style=None):
    """Constructs tiles url for girder large-image display

    """
    base_url = '{}/api/v1/item/{}/tiles/zxy/{{z}}/{{x}}/{{y}}'.format(
        girder_url, item_id)
    mapnik_string = ''
    if mapnik_style:
        if isinstance(mapnik_style, str):
            style_string = mapnik_style
        else:
            style_string = json.dumps(mapnik_style)
        encoded_string = urllib.parse.quote_plus(style_string)
        mapnik_string = '&style={}'.format(encoded_string)
    tiles_url = '{}?encoding=PNG&projection=EPSG:3857{}'.format(
        base_url, mapnik_string)
    return tiles_url
