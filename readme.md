## Set up database

```bash
docker compose up -d
```

- set environment variable DATABASE_URL

## View database

- go to http://localhost to view pgAdmin
- login with default credentials present in [compose.yaml](compose.yaml)
- in the **Register - Server** window

  - fill out general info
  - get hostname from

  ```bash
  docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' pathfinder-postgres
  ```

  - get username and password from [compose.yaml](compose.yaml)
  - click **save**

## Play around in postgres cli

```bash
docker exec -it pathfinder-postgres bash
su - postgres
\dt
```

---

address,token0.\_id,token0.address,token0.quantity,token1.\_id,token1.address,token1.quantity
