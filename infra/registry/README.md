Registry & TLS deployment guide

This folder contains a recommended Docker Compose setup to run a private Docker Registry behind an Nginx reverse-proxy with TLS and basic authentication.

Important notes
- Do NOT expose a plain HTTP registry on the public internet. Use TLS and authentication.
- For production, use Let's Encrypt certificates (recommended) or another CA. Do NOT use self-signed certs for public access.

Prerequisites on the host
- Docker and Docker Compose installed
- A domain name pointing to the server's public IP (e.g., registry.example.com)
- Port 80 and 443 reachable

Quick setup (Let's Encrypt + certbot recommended)

1) Create directories on the host (inside infra/registry):

   mkdir -p infra/registry/data infra/registry/certs

2) Obtain TLS certificates (Let's Encrypt example using certbot --standalone):

   sudo apt update && sudo apt install certbot -y
   sudo certbot certonly --standalone -d registry.example.com

   After success, copy the certs into infra/registry/certs:

   sudo cp /etc/letsencrypt/live/registry.example.com/fullchain.pem infra/registry/certs/
   sudo cp /etc/letsencrypt/live/registry.example.com/privkey.pem infra/registry/certs/

   The docker-compose mounts ./certs into nginx at /etc/nginx/certs.

3) Create an htpasswd file (basic auth) - example using Docker httpd image:

   docker run --rm httpd:2.4-alpine htpasswd -Bbn myuser 'MyS3cretP@ss' > infra/registry/htpasswd

   Replace myuser/MyS3cretP@ss with a strong username and password.

4) Start the stack:

   cd infra/registry
   docker compose up -d

5) Test login & push from a client machine

   docker login https://registry.example.com
   # enter username/password created earlier

   # tag an image and push
   docker tag your-image:latest registry.example.com/your-repo:tag
   docker push registry.example.com/your-repo:tag

Firewall & security
- Allow only required ports (80,443) and limit access if needed.
- Consider setting up Fail2ban and monitoring.

Notes on self-signed certificates (dev only)
- You can create self-signed certs for testing, but Docker clients may require --insecure-registry configuration. Use only for local testing.
