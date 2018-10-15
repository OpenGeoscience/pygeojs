pygeojs
===============================

ipywidget wrapper for GeoJS

Installation
------------

To install use pip:

    $ pip install pygeojs
    $ jupyter nbextension enable --py --sys-prefix pygeojs


For a development installation (requires npm),

    $ git clone https://github.com//pygeojs.git
    $ cd pygeojs
    $ pip install -e .
    $ jupyter nbextension install --py --symlink --sys-prefix pygeojs
    $ jupyter nbextension enable --py --sys-prefix pygeojs
    $ jupyter labextension install js
