#!/bin/bash

set +e +u

while [ 1 ]; do
    (echo || echo) > log/messages
    echo "Current entropy:" >> log/messages
    dd if=/dev/urandom bs=128 count=1 | hexdump >> log/messages
    (echo || echo) >> log/messages
    fortune > log/messages
    (echo || echo) >> log/messages
    sleep 3
done

