FROM ubuntu:24.04

WORKDIR /app

RUN export DEBIAN_FRONTEND=noninteractive && \
    apt-get update && \
    apt-get dist-upgrade -y && \
    apt-get install -y --no-install-recommends \
        git python3-venv build-essential \
        libxxf86vm1 libsm6 libnotify4 libsdl2-2.0 \
        cmake libdbus-1-dev libglib2.0-dev libpython3-dev \
        libxtst6 libgl1 libegl1 libglu1-mesa && \
    rm -rf /var/lib/apt/lists/* 


RUN mkdir -p /opt && cd /opt && \
    python3 -m venv venv && \
    . venv/bin/activate && \
    git clone https://github.com/Atelier-Epita/Printrun-lite.git && \
    cd Printrun-lite && \
    git checkout printcore && \
    python -m pip install .

COPY setup.py /app
COPY makerprint/ /app/makerprint

RUN --mount=type=cache,target=/root/.cache/pip,id=pip-cache \
    . /opt/venv/bin/activate && \
    cd /app && \
    python -m pip install .

COPY entrypoint .
ENTRYPOINT "/app/entrypoint"

