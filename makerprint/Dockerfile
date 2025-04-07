FROM ubuntu:24.04

WORKDIR /app

# this tag is the last one that works with wxpython 4.2.2
ARG TAG=9ff2df639df093f251d6239f2635a007bf4287ea

RUN export DEBIAN_FRONTEND=noninteractive && \
    apt-get update && \
    apt-get dist-upgrade -y && \
    apt-get install -y --no-install-recommends \
        python3.10 git python3-venv build-essential \
        libgtk-3.0 libxxf86vm1 libsm6 libnotify4 libsdl2-2.0 \
        cmake libdbus-1-dev libglib2.0-dev libpython3-dev \
        libxtst6 libgl1 libegl1 libglu1-mesa && \
    rm -rf /var/lib/apt/lists/* 


RUN mkdir -p /opt && cd /opt && \
    python3 -m venv venv && \
    . venv/bin/activate && \
    git clone https://github.com/kliment/Printrun.git && \
    cd Printrun && \
    git checkout $TAG && \
    python -m pip install https://extras.wxpython.org/wxPython4/extras/linux/gtk3/ubuntu-24.04/wxPython-4.2.2-cp312-cp312-linux_x86_64.whl && \
    python -m pip install .

COPY setup.py /app
COPY makerprint/ /app/makerprint

# pip cache
RUN --mount=type=cache,target=/root/.cache/pip,id=pip-cache \
    . /opt/venv/bin/activate && \
    cd /app && \
    python -m pip install .

COPY entrypoint .
ENTRYPOINT "/app/entrypoint"

