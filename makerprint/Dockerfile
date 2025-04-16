FROM debian:bookworm-slim

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        git python3 python3-venv build-essential \
        libxxf86vm1 libsm6 libnotify4 libsdl2-2.0 \
        cmake libdbus-1-dev libglib2.0-dev libpython3-dev \
        libxtst6 libgl1 libegl1 libglu1-mesa && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

RUN python3 -m venv /opt/venv 
ENV PATH="/opt/venv/bin:$PATH"

# install printcore and some utils
WORKDIR /opt
RUN git clone https://github.com/Atelier-Epita/Printrun-lite.git && \
    cd Printrun-lite && \
    git checkout printcore && \
    python -m pip install --no-cache-dir .

# install makerprint package
WORKDIR /app
COPY setup.py /app
COPY makerprint/__init__.py /app/makerprint/__init__.py
RUN pip install --no-cache-dir -e .

# copy the rest of the code
COPY makerprint/ /app/makerprint

CMD [ "makerprint" ]
