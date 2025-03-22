# practical-microservice-workshop

## Run Kong and necessary services

```bash
docker compose -f kong-docker-compose.yaml up
```

## Run Keycloak

```bash
 docker compose -f keycloak-docker-compose.yaml up
```

## Run microservices dependency

```bash
docker compose up
```