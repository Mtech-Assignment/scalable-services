#!/bin/bash

# Set the environment file path
ENV_FILE="../payment/.env"

# Check if the .env file exists
if [ ! -f "$ENV_FILE" ]; then
  echo ".env file for marketplace not found!"
  exit 1
fi

# Read the .env file and create the secret YAML
SECRET_NAME="payment-secret"
SECRET_FILE="../k8s-configuration/payment-secret.yaml"

# Start creating the YAML
echo "apiVersion: v1" > $SECRET_FILE
echo "kind: Secret" >> $SECRET_FILE
echo "metadata:" >> $SECRET_FILE
echo "  name: $SECRET_NAME" >> $SECRET_FILE
echo "type: Opaque" >> $SECRET_FILE
echo "data:" >> $SECRET_FILE

# Read each line from the .env file and encode it in base64
while IFS='=' read -r key value; do
  # Skip empty lines or lines starting with #
  if [ -z "$key" ] || [[ "$key" == \#* ]]; then
    continue
  fi
  # Encode value in base64 and add to the YAML
  encoded_value=$(echo -n "$value" | base64)
  echo "  $key: $encoded_value" >> $SECRET_FILE
done < $ENV_FILE

echo "Secret YAML file generated at: $SECRET_FILE"
