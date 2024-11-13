#!/bin/bash

pwd
cd scripts_for_env
./authentication_env.sh
./digital_asset_env.sh
./marketplace_env.sh
./payment_env.sh

cd ..
cd k8s-configuration
pwd
kubectl apply -f authentication-secret.yaml
kubectl apply -f digital-asset-secret.yaml
kubectl apply -f marketplace-secret.yaml
kubectl apply -f payment-secret.yaml

# Apply AMQP
kubectl apply -f amqp-service.yaml
kubectl apply -f amqp-persistent-volume.yaml
kubectl apply -f amqp-deployment.yaml

# Apply mongo
kubectl apply -f mongodb-service.yaml
kubectl apply -f mongodb-configmap.yaml
kubectl apply -f mongodb-persistent-volume.yaml
kubectl apply -f mongodb-deployment.yaml

# Apply AUthentication
kubectl apply -f authentication-secret.yaml
kubectl apply -f authentication-service.yaml
kubectl apply -f authentication-deployment.yaml

# Apply digital-asset
kubectl apply -f digital-asset-secret.yaml
kubectl apply -f digital-assets-service.yaml
kubectl apply -f digital-assets-deployment.yaml

# Apply marketplace
kubectl apply -f marketplace-secret.yaml
kubectl apply -f marketplace-service.yaml
kubectl apply -f marketplace-deployment.yaml

# Apply payment
kubectl apply -f payment-secret.yaml
kubectl apply -f payment-service.yaml
kubectl apply -f payment-deployment.yaml

kubectl apply -f ingress.yaml
