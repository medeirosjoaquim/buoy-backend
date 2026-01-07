# Node Tech Challenge

Welcome to Buoy's Node tech challenge!

This repository contains a partially implemented accommodations booking REST API, designed as a work-in-progress prototype for a real-world application.

You must use the provided code sample and its dependencies to solve the problems explained below.

The solution must be a cloud git repository, hosted on any cloud git tool of your choice.

- Its first commit must:
  - Have the message "First commit"
  - Have the exact code sample as it was provided, no changes whatsoever
- From this point on, work on the problems exposed below as you like

NOTE: In case you want to create a private git repository, please grant the user matthew@buoydevelopment.com full access to the repo. If you do so, please make it clear once you reply with your answer.

---

# Problem #1

### Issue to solve

There's an Accommodations entity already in place, however the business model only includes Hotels and Apartments.

### Expected behaviour

- Add this 2 new entities to the project.
- Provide endpoints for their management.

# Problem #2

### Issue to solve

Currently, every Accommodation can contain several overlapping Bookings with the same `startDate` and `endDate`. This makes sense for Hotels, which can have different Rooms booked simultaneously, but it wouldn't work for Apartments.

### Expected behaviour

- Apartments should not allow overlapping bookings during the same period (`startDate` and `endDate`).
- Hotels should allow overlapping bookings during the same period, as these would correspond to bookings for different rooms within the hotel.

# Problem #3

### Issue to solve

The frontend needs to, given an accommodation's `id` and a `date`, retrieve the next available date for that accommodation.

### Question

- How would you solve this problem?
A:

1. Differentiate by accommodation type - Apartments have capacity of 1, hotels have configurable roomCount
2. For a given date, count overlapping bookings - A booking overlaps if startDate <= date < endDate
3. Find next available date:
   - If overlappingCount < capacity → requested date is available
   - Otherwise, find the earliest endDate among overlapping bookings and check that date
   - Repeat until we find a date where overlappingCount < capacity
 4. Edge case handling:
   - Adjacent bookings (checkout = checkin) are NOT overlapping
   - Limit search to 365 days to prevent infinite loops
   - Handle consecutive bookings by chaining through end dates

- What data or API would you provide to the frontend?
A:
Endpoint:
  GET /accommodations/:id/availability?date=2024-01-15

  Response:
  {
    "accommodationId": 1,
    "requestedDate": "2024-01-15",
    "nextAvailableDate": "2024-01-20",
    "isRequestedDateAvailable": false
  }

  Structure:
  - isRequestedDateAvailable - allows frontend to immediately show "Available!" or "Not available"
  - nextAvailableDate - enables "Next available: Jan 20" messaging
  - requestedDate echoed back - helps frontend confirm the query without tracking state
  - Single endpoint works for both hotels and apartments - frontend doesn't need to know capacity logic

## TECH CONTEXT
### Stack

The main libraries are:
- [Fastify](https://fastify.dev/docs/v4.29.x/)
- [MikroOrm](https://mikro-orm.io/docs/5.9/quick-start)

### Docker Setup
To set up the project using Docker Compose, follow these steps:

1. Ensure you have Docker and Docker Compose installed on your machine.
2. Build and start the Docker containers:

  ```bash
  docker-compose up --build
  ```

3. The application should now be running and accessible at `http://localhost:8006`.

### Swagger 

```
http://localhost:8006/documentation
```

### Migrations

New migrations are applied every time the server is started.

Migrations will be needed when an existing entity changes any of it's Properties, is deleted, or a new one is added.

#### Migration creation
1. Stop every running container: `docker compose down`
2. In one terminal, run the postgres container `docker compose up postgres`
3. In another terminal, run the following command: `docker-compose run --rm app npm run generate-migration`
4. If there are changes in the schema, a new migration will be created under `src/migrations`

#### Migration Up
1. Stop every running container: `docker compose down`
2. In one terminal, run the postgres container `docker compose up postgres`
3. In another terminal, run the following command: `docker-compose run --rm app npm run migration:up`

#### Migration Down
1. Stop every running container: `docker compose down`
2. In one terminal, run the postgres container `docker compose up postgres`
3. In another terminal, run the following command: `docker-compose run --rm app npm run migration:down`

Notes: 
> There was a issue with zod-to-json-schema where it created a recursive type (type that has child prop that has itself as child prop) it was decreasing performance ans slowing build. I upgraded zod version which can generarate json schema out of the box ans solves the issue. The build time went from 1m30.5s down to 2.795s