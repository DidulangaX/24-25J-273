# Learnopia

Welcome to the Learnopia! This project utilizes Docker for containerization and orchestration of backend services and a frontend.

## Project Structure

```bash
project_root/
  |- backend/
      |- services/
          |- service1/
              |- Dockerfile
              |- (other service1 files)
          |- service2/
              |- Dockerfile
              |- (other service2 files)
          |- service3/
              |- Dockerfile
              |- (other service3 files)
          |- ..
  |- frontend/
      |- Dockerfile
      |- (other frontend files)
  |- docker-compose.yml

```

## Docker & K8s Configurations

To build the Docker images for all services and the frontend, and start the containers, use the following commands:

```bash
# Build the Docker images
docker-compose build

# Start the containers
docker-compose up

# Discover available Docker images
docker images

# Give your Docker image a unique identifier
docker tag <image id> darshib/learnopia:<image name>
docker tag 16e2a12f3fe1 darshib/learnopia:learnopia-service5

# Share your Docker image with the world
docker push darshib/learnopia:<image name>
docker push darshib/learnopia:learnopia-service5 

# Craft Kubernetes manifest file (yaml)
# Apply Deployment
kubectl apply -f <manifest file name>.yaml
kubectl apply -f notification-deployment.yaml

# Validate Kubernetes resources
kubectl get deployments
kubectl get pods

# Delete Kubernetes
kubectl delete deployment <file name>
kubectl delete deployment authenticate-deployment

```

## YouTube Demo
https://youtu.be/9BfAqI4ydmc?si=kmwzFZqWuntMUC9-


## Live Preview
https://learnopia-edu.netlify.app/




