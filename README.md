pygeojs
===============================

ipywidget wrapper for GeoJS

Installation
------------

Before installing, setup a virtual environment and install jupyter
there. Then install either a release or developer version as follows.

For a release installation, use pip:

    $ pip install pygeojs
    $ jupyter nbextension enable --py --sys-prefix @johnkit/pygeojs
    $ jupyter labextension install @johnkit/pygeojs


For a development installation (requires pip & npm),

    $ git clone https://github.com//pygeojs.git
    $ cd pygeojs
    $ cd js
    $ npm install
    $ cd ..
    $ pip install -e .
    $ jupyter nbextension install --py --symlink --sys-prefix pygeojs
    $ jupyter nbextension enable --py --sys-prefix pygeojs
    $ jupyter labextension install js


If you change any autogen scripts/files, you can run

    npm run autogen

to regenerate the js and python wrapper files.
