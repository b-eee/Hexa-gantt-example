#!/bin/bash

APP_NAME=${APP_NAME:-hexa-gantt}

start () {
  export ENV=${ENV:-'local'}
  npm start
}

# ./do.sh build_push [project_id]
build_push () {
  PROJECT_ID=${PROJECT_ID:-$1}
  TAG=${TAG:-latest}

  docker build -t gcr.io/${PROJECT_ID}/beee-${APP_NAME}:${TAG} --no-cache --file=$GOPATH/src/${APP_NAME}/docker/app/Dockerfile .
  docker -- push gcr.io/${PROJECT_ID}/beee-${APP_NAME}:${TAG}
}

# generate_k8s_config () {
#     mkdir -p ./docker/k8s/configs

#     cat > ./docker/k8s/configs/worklifecare-envs.yml <<EOF
# apiVersion: v1
# kind: ConfigMap
# metadata:
#   name: worklifecare-envs
#   labels:
#     app: worklifecare
#     component: microservice
#     role: worklifecare
# data:
#   API_ADDRESS: "beee-apicore"
#   API_SERVER_PORT: "9000"
# EOF
# }

$*