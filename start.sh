#!/bin/bash

# Script to set up and populate PostgreSQL database for Pathfinder

# Turn Docker on and start Docker Compose
docker compose up -d

# Start a Docker container named "pathfinder-postgres" with PostgreSQL
docker run --name pathfinder-postgres -e POSTGRES_PASSWORD=mysecretpassword -d postgres

# Run commands to populate the database
npm run populate-db
npm run populate-db-v3
npm run update-reserves
npm run update-reserves-V3
