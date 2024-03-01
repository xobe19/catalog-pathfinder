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

---

pairs:

- wbtc, usdc, amount: 1000000000, hops: 10, time: 23.1919656 seconds
- usdc, usdc, amount: 1000000000, hops: 10, time: 27.9048562 seconds
- shibainu, usdc, amount: 1000000000, hops: 10, time: 43.4950882 seconds

```
fetched 308530 rows from db
Optimal path
Set(7) {
 '0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce',
 '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
 '0xd46ba6d942050d489dbd938a2c909a5d5039a161',
 '0xd233d1f6fd11640081abb8db125f722b5dc729dc',
 '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
 '0x6b175474e89094c44da98b954eedeac495271d0f',
 '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
}
Set(7) {
 100000000000000000000000000n,
 376284440322053077n,
 947891309896n,
 5308236466235n,
 8728519025566025248n,
 18455247818942650457022n,
 17942202343n
}
17942202343n

findPath(
  data.shibainu.address,
  data.usdc.address,
  BigInt("100000000000000000000000000")
)
let HOPS = 10;
```
