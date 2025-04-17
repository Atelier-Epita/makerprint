FROM python:3.11-slim-bookworm AS builder

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        git build-essential python3-dev \
        libdbus-1-dev libglib2.0-dev libxtst6 libgl1 libegl1 && \
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

FROM python:3.11-slim-bookworm
WORKDIR /app

ENV PATH="/opt/venv/bin:$PATH"
COPY --from=builder /opt/venv /opt/venv
COPY --from=builder /app /app

CMD [ "makerprint", "--debug" ]
