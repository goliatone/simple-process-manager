## Simple Process Manager

Simple Node.js process manager.

```
$ npm i simple-process-manager
```


### Usage

If you want to start 3 instances of a background process:

```
$ pm start ./workers/background-command.js --total 3
```

The process manager will ensure that the process stays alive.

The worker has to expose a `start` and a `stop` functions.

```js
module.exports = {
    start(config) {
        //initialize your worker...
    },
    close() {
        return new Promise(resolve => {
            //clean up code...
        });
    }
};
```

### TODO

* [ ] Enable passing env to worker
* [ ] Memory graph: Show CLI UI with memory graph per worker
* [ ] Abstract transport so we can communicate with workers using:
    - [ ] IPC
    - [ ] Unix socket
    - [ ] TCP socket
    - [ ] MQTT
* [ ] Give each cluster leader a unique ID
* [ ] Provide interface so cluster leaders are addressable
    - [ ] Locally
    - [ ] Remotely
* [ ] Create a worker shell so we can wrap scripts that do not expose start/close.
* [ ] Enable loading custom configurations to pass along to workers

## License
® 2019 License MIT by goliatone
