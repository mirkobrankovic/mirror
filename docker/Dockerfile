FROM ubuntu:20.04
ARG DEBIAN_FRONTEND=noninteractive
ENV TZ=Europe/Amsterdam
RUN sed -i -e's/ main/ main contrib non-free/g' /etc/apt/sources.list \
    && apt update \
    && apt install -y curl build-essential nginx cmake python3-dev python3-pip nodejs npm ffmpeg \
    && rm -rf /var/lib/apt/lists/*
RUN pip3 install --upgrade pip
RUN pip3 install wheel face_recognition deepspeech
RUN npm i express winston moment

RUN mkdir -p /opt/mirror/known/all
RUN curl -LO https://github.com/mozilla/DeepSpeech/releases/download/v0.9.3/deepspeech-0.9.3-models.pbmm\
    && curl -LO https://github.com/mozilla/DeepSpeech/releases/download/v0.9.3/deepspeech-0.9.3-models.scorer \
    && mv deepspeech* /opt/mirror/

COPY default /etc/nginx/sites-available

RUN service nginx start

COPY *.jpg /opt/mirror/known/all
COPY uploader.js /opt/mirror
COPY log.js /opt/mirror
COPY . /usr/share/nginx/html

EXPOSE 3000 80

CMD ["sh", "-c", "service nginx start ; nodejs /opt/mirror/uploader.js"]
#CMD ["nodejs", "/opt/mirror/uploader.js"]
