# launch the docker compose file and expose port 27017

docker build -t mongodb ./database
docker run -d -p 127.0.0.1:27017:27017 mongodb
