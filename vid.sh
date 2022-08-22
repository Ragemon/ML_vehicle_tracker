#m3url="https://ITSStreamingBR.dotd.la.gov/public/br-cam-018.streams/playlist.m3u8"
#ffmpeg -re -y -i $m3url -t 180 -c copy sandbox/nor-cam-023.mp4
#m3url="https://ITSStreamingNO.dotd.la.gov/public/nor-cam-023.streams/playlist.m3u8"
#m3url="https://itsstreamingno.dotd.la.gov/public/ns-cam-255.streams/playlist.m3u8"
#m3url="https://ITSStreamingBR.dotd.la.gov/public/br-cam-072.streams/playlist.m3u8"
#m3url="https://ITSStreamingBR.dotd.la.gov/public/br-cam-256.streams/playlist.m3u8"
#m3url="https://ITSStreamingBR.dotd.la.gov/public/br-cam-010.streams/playlist.m3u8"
m3url="https://ITSStreamingBR.dotd.la.gov/public/br-cam-007.streams/playlist.m3u8"
dst="/workspace/deepmetrics/github.com/prototypes/dpm/sandbox/br-cam-007-10.mp4"
cvlc "$m3url" --sout "#file{dst=$dst,overwrite}" --no-sout-all --sout-keep
