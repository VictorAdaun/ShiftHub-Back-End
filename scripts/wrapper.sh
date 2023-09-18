#!/bin/bash --

# run db migrations
yarn prisma migrate deploy

# Start public process
node build/server/public.js &
  
# Start internal process
node build/server/internal.js 
