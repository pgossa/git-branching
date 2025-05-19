FROM nginx:1.28.0-alpine3.21-perl

# Setup Dev Container
ARG USERNAME=vscode
ARG GROUPNAME=$USERNAME
ARG USER_UID=1000
ARG USER_GID=$USER_UID

# Create the user
RUN addgroup \
    --gid "$USER_GID" \
    "$GROUPNAME" \
&&  adduser \
    --disabled-password \
    --gecos "" \
    --ingroup "$GROUPNAME" \
    --uid "$USER_UID" \
    $USERNAME \
    #
    # [Optional] Add sudo support. Omit if you don't need to install software after connecting.
    && apk upgrade --no-cache \
    && apk add sudo \
    && echo $USERNAME ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/$USERNAME \
    && chmod 0440 /etc/sudoers.d/$USERNAME

# ********************************************************
# * Anything else you want to do like clean up goes here *
# ********************************************************

COPY .devcontainer/nginx.conf /etc/nginx/nginx.conf

# Setup container
RUN sudo apk upgrade --no-cache
RUN sudo apk add git
