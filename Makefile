# Makefile for Docker build and push

# Check if the first argument is a version number (matches X.Y.Z format)
VERSION_ARG := $(shell echo $(firstword $(MAKECMDGOALS)) | grep -E '^[0-9]+\.[0-9]+\.[0-9]+$')

# If version argument is detected, use it and remove from goals
ifneq ($(VERSION_ARG),)
    VERSION := $(VERSION_ARG)
    # This makes the version number not be treated as a target
    $(eval $(VERSION_ARG):;@:)
endif

# Variables
IMAGE_NAME := pgossa/git-branching
IMAGE_TAG := 1.0.0
REGISTRY := docker.io
DOCKERFILE_PATH := ./Dockerfile
PUSH_LATEST := true

# Default registry can be overridden
ifdef DOCKER_REGISTRY
	REGISTRY := $(DOCKER_REGISTRY)
endif

# Require VERSION for build and push operations
# If not building/pushing or if already specified, use default
ifeq ($(findstring build,$(MAKECMDGOALS))$(findstring push,$(MAKECMDGOALS)),)
  # Not building or pushing, so VERSION not required
else ifndef VERSION
  ifneq ($(IMAGE_TAG),latest)
    # If tag is already set to something other than latest, use that
  else
    # Building or pushing without VERSION specified
    $(error VERSION is required. Please specify with VERSION=x.y.z)
  endif
endif

# Use VERSION if provided
ifdef VERSION
	IMAGE_TAG := $(VERSION)
endif

# Full image name with registry and tag
FULL_IMAGE_NAME := $(REGISTRY)/$(IMAGE_NAME):$(IMAGE_TAG)
LATEST_IMAGE_NAME := $(REGISTRY)/$(IMAGE_NAME):latest

.PHONY: help build push build-push clean

# Default target is build-push
.DEFAULT_GOAL := build-push

help:
	@echo "Available targets:"
	@echo "  help       - Display this help message"
	@echo "  build      - Build the Docker image"
	@echo "  push       - Push the Docker image to registry"
	@echo "  build-push - Build and push the Docker image (default)"
	@echo "  clean      - Remove local Docker image"
	@echo ""
	@echo "Variables that can be overridden:"
	@echo "  IMAGE_NAME     - Name of the image (default: $(IMAGE_NAME))"
	@echo "  VERSION        - Version tag for the image (required for build/push)"
	@echo "  REGISTRY       - Docker registry (default: $(REGISTRY))"
	@echo "  DOCKERFILE_PATH - Path to Dockerfile (default: $(DOCKERFILE_PATH))"
	@echo "  PUSH_LATEST    - Also tag and push as latest (default: true, set to false to disable)"
	@echo ""
	@echo "Example usage:"
	@echo "  make build VERSION=1.0.0               # Specify version as variable"
	@echo "  make 1.0.0                             # Specify version directly (builds & pushes)"
	@echo "  make build 1.0.0                       # Specify version directly (builds only)"
	@echo "  make build-push 1.0.0 PUSH_LATEST=false # Don't push as latest"

# Build the Docker image
build:
	@echo "Building Docker image: $(FULL_IMAGE_NAME)"
	docker build -t $(FULL_IMAGE_NAME) -f $(DOCKERFILE_PATH) .
ifeq ($(PUSH_LATEST),true)
	@echo "Also tagging as latest"
	docker tag $(FULL_IMAGE_NAME) $(LATEST_IMAGE_NAME)
endif
	@echo "Successfully built $(FULL_IMAGE_NAME)"

# Push the Docker image to the registry
push:
	@echo "Pushing Docker image: $(FULL_IMAGE_NAME)"
	docker push $(FULL_IMAGE_NAME)
ifeq ($(PUSH_LATEST),true)
	@echo "Also pushing as latest"
	docker push $(LATEST_IMAGE_NAME)
endif
	@echo "Successfully pushed $(FULL_IMAGE_NAME)"

# Build and push in one command
build-push: build push

# Clean up local image
clean:
	@echo "Removing Docker image: $(FULL_IMAGE_NAME)"
	docker rmi $(FULL_IMAGE_NAME) || true
ifeq ($(PUSH_LATEST),true)
	@echo "Removing latest tag: $(LATEST_IMAGE_NAME)"
	docker rmi $(LATEST_IMAGE_NAME) || true
endif
	@echo "Cleanup complete"