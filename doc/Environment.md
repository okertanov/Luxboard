Luxboard
========

MVP
---

Future
------

Architecture
------------
### Static site

### API

Server
------
### Node.js & NPM
    sudo apt-get install python-software-properties
    sudo apt-add-repository ppa:chris-lea/node.js
    sudo apt-get update
    sudo apt-get install nodejs npm

### Node modules
    export NODE_PATH="'$(npm root -g)'"
    NODE_ENV=production node server
* forever
* socket.io
* express
* underscore
* mongoose

### Requirements
#### nginx
    add-apt-repository ppa:nginx/stable
    apt-get update && apt-get install nginx
#### mongodb
    sudo aptitude install mongodb

#### varnish

Deploy
------
    cd /srv/git
    sudo git --bare init --shared Luxboard.git
    sudo chown -R okertanov:developers Luxboard.git
    cd Luxboard.git
    git update-server-info

    sudo vim /srv/git/Luxboard.git/hooks/post-receive
    sudo chmod 755 /srv/git/Luxboard.git/hooks/post-receive

    cd /srv/www
    sudo git clone /srv/git/Luxboard.git luxboard.lan
    sudo chown -R okertanov:okertanov luxboard.lan

