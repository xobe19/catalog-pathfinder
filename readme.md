## Set up redis

### Start redis server and expose it's default port

```bash
docker run --name redis-container -p 6379:6379 -d redis redis-server --save 60 1 --loglevel warning
```

### Run redis-cli to test out stuff

```bash
docker exec -it redis-container redis-cli
```

### List all set keys

```
keys *
```
