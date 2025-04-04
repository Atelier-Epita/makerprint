# maker-print


3D printer tool to manage and automate a bunch of 3d printers from a single device

## Dev Installation

run everything with docker-compose

```bash
docker-compose up --build
```

change the `docker-compose.yml` file to match your setup (ports, volumes, etc.)

## Frontend

```
Also make sure to change the `REACT_APP_API_URL` to match your setup.

### start the app

```bash
cd makerprint-app
npm install
npm run start # or npm run build to build the app
```

Here is an overview of the app:
![overview](ressources/overview.png)


## Backend

```bash
# display the help
makerprint --help

# start the server with the default config
makerprint --config makerprint.env
```

make sure to change the config in `makerprint/makerprint.env` to match your setup (logs location, gcode files locations, and so on).


## Nginx configuration

here is an example of a simple nginx configuration to serve the static files and proxy the api calls to the flask server

```nginx
server {
	listen 80;
	server_name makerprint.local;

	root /home/maxime/github/maker-print/makerprint/build;
	index index.html;

	location / {
		try_files $uri $uri/ /index.html;
	}

	location ~ ^/api(/.*)$ {
		rewrite ^/api(/.*)$ $1 break;
		proxy_pass http://127.0.0.1:5000;
		proxy_set_header Host $host;
		proxy_set_header X-Real-IP $remote_addr;
		proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
		proxy_set_header X-Forwarded-Proto $scheme;
	}

	error_log /var/log/nginx/makerprint_error.log;
	access_log /var/log/nginx/makerprint_access.log;
}
```
