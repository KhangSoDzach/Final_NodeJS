# Docker Deployment Guide for SourceComputer

This guide explains how to deploy the SourceComputer application using Docker Compose with horizontal scaling capabilities.

## Prerequisites

- Docker and Docker Compose installed on your machine
- Git (optional, for cloning the repository)

## Deployment Instructions

1. Clone or download the SourceComputer application to your local machine.

2. Navigate to the project directory:
   ```
   cd path/to/SourceComputer
   ```

3. Start the application using Docker Compose:
   ```
   docker compose up -d
   ```
   
   This command will:
   - Build the application container
   - Start 2 instances of the application (for horizontal scaling)
   - Start the MongoDB database
   - Start Redis for session management and caching
   - Start an Nginx load balancer to distribute traffic

4. Access the application by opening your browser and navigating to:
   ```
   http://localhost
   ```

## How Horizontal Scaling Works

The application has been configured for horizontal scaling through the following features:

1. **Multiple Application Instances**: The docker-compose.yml file is configured to run 2 instances of the application container. This can be increased by changing the `replicas` value.

2. **Nginx Load Balancer**: Nginx distributes incoming requests across all application instances, ensuring even load distribution.

3. **Redis Session Store**: All application instances share session data through Redis, ensuring users maintain their session regardless of which instance handles their request.

4. **Shared MongoDB Database**: All application instances connect to the same MongoDB database.

5. **Stateless Architecture**: The application is designed to be stateless, with sessions stored in Redis and all data in MongoDB.

## Scaling the Application

To increase or decrease the number of application instances:

1. Edit the `docker-compose.yml` file and change the `replicas` value under the app service:
   ```yaml
   deploy:
     replicas: 4  # Change this value to the desired number of instances
   ```

2. Apply the changes:
   ```
   docker compose up -d
   ```

## Stopping the Application

To stop all containers:
```
docker compose down
```

To stop and remove all containers, volumes, and networks:
```
docker compose down -v
```

## Troubleshooting

If you encounter any issues:

1. Check the logs:
   ```
   docker compose logs
   ```

2. Check the logs for a specific service:
   ```
   docker compose logs app
   ```

3. Ensure all services are running:
   ```
   docker compose ps
   ```