# Babel-Koa

---------------
docker build -t featx/babel-koa .

docker run --name babel-koa -dit --restart unless-stopped -p 8081:8081 \
-v `Config Path`:/mnt/app/babel-koa/config \
-v `LogPath`:/mnt/app/babel-koa/log \
featx/babel-koa``