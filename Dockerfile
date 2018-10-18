# docker build -t pygeojs .
# docker run -it --rm -p 8888:8888 --hostname localhost pygeojs
# Find the URL in the console and open browser to that url

FROM jupyter/base-notebook

# Install jupyterlab widget manager (needed for custom widgets)
RUN jupyter labextension install @jupyter-widgets/jupyterlab-manager

# Copy source files
USER root
ADD ./ /home/$NB_USER/pygeojs
RUN chown -R ${NB_UID}:${NB_UID} ${HOME}
USER ${NB_USER}

# Build autogen files
WORKDIR /home/$NB_USER/pygeojs/js
RUN npm install
RUN npm run autogen

# Install JupyterLab extension
WORKDIR /home/$NB_USER/pygeojs
RUN python setup.py install
RUN jupyter nbextension install --py --symlink --sys-prefix pygeojs
RUN jupyter nbextension enable --py --sys-prefix pygeojs
RUN jupyter labextension install js

# Setup entry point
WORKDIR /home/$NB_USER/pygeojs/notebooks
CMD ["jupyter", "lab", "--ip", "0.0.0.0"]
