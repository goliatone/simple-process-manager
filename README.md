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

```
$ pm info
name:        example
worker:      /Users/peperone/simple-process-manager/server
instances:   8
description: Example showing how to run CLI process manager
pid:         19365
pids: 
  - 19366
  - 19367
  - 19368
  - 19369
  - 19370
  - 19371
  - 19372
  - 19373
```

```
$ pm restart background-command
```

#### Signals

##### SIGUSR2

If you want to restart your workers- say because you changed the script source code- you can use a signal using the leader's **pid**:

```
$ kill -SIGUSR2 <pid>
```

##### SIGTERM

This will terminate all workers immediately without waiting for them to clean up.

```
$ kill -SIGTERM <pid>
```

##### SIGINT

This will terminate all workers but will wait for them to clean up up to `timeout`.

```
$ kill -SIGINT <pid>
```

## Changelog

* 2019-09-01 v0.4.2 Bug fixes
* 2019-09-01 v0.4.0 Added CLI commands to manage metadata and restart workers
* 2019-08-31 v0.3.0 Enable restarting workers using `SIGUSR2` signal
* 2019-08-04 v0.2.0 Clean up, promisify, and expose CLI
* 2019-08-03 v0.1.0 Initial release


### TODO

* [ ] Expose as a [core.io-cli](https://github.com/goliatone/core.io-cli) command plugin
* [ ] Create CLI so we can:
    - [x] list current workers
    - [x] restart workers
    - [ ] remove workers
* [ ] Pass metadata file location as option
* [ ] Memory graph: Show CLI UI with memory graph per worker
* [ ] Enable passing env to worker
* [ ] Abstract transport so we can communicate with workers using:
    - [ ] IPC
    - [ ] Unix socket
    - [ ] TCP socket
    - [ ] MQTT
* [x] Give each cluster leader a unique ID/name
* [ ] Provide interface so cluster leaders are addressable
    - [ ] Locally
    - [ ] Remotely
* [ ] Create a worker shell so we can wrap scripts that do not expose start/close.
* [ ] Enable loading custom configurations to pass along to workers


## License
® 2019 License MIT by goliatone
