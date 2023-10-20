#!/bin/sh
set -e
(cd gramine-build && git clean -fxd)
cp -r dist gramine-build/app
cp `which node` gramine-build/

docker run \
 -u $(id -u ${USER}):$(id -g ${USER}) \
 -it --rm \
 -v`pwd`/gramine-build:/gramine-build \
 --env IAS_SPID \
 kvin/gramine:1.0 \
 "make dist -C /gramine-build/"
