# bpmn-instanes
[![Build Status](https://travis-ci.org/cquencial/meteor-bpmn-instances.svg?branch=master)](https://travis-ci.org/cquencial/meteor-bpmn-instances)


Instances management for `cquencial:bpmn-engine`. This extension allows you to easily access (and thus manage) running process instances.

### Installation

Add this package with `cquencial:bpmn-engine` to your packages list (if you didn't already install `cquencial:bpmn-engine`):

`meteor add cquencial:bpmn-engine cquencial:bpmn-instances`


### How it works

If the extension is active each new created process instance (`new Bpmn.Engine`) will receive a unique `instanceId`
(which is also a relevant part of other extensions). A document, keeping this `instanceId` is created and added to the
`Bpmn.instances.collection` Collection. By the same id a reference to the instance is added to a cache dictionary.


You can create subscribe to the collection and therefore let your client's manage the instances. See the example project
for some use cases.

If a process ends, is stopped or cancelled or the server restarts, the reference and the document are removed from the cache / the collection.


### Usage

The extension is off by default. To activate it, you need to switch the extension to `on` in your **server** environment.
Note, that the extension is not to be imported by itself but decorated to the `Bpmn` class/object.


```javascript
import { Bpmn } from 'cquencial:bpmn-engine';

Bpmn.instances.on();
```

This activates the extension to listen to every possible BPMN process state change and creates a new persistence state,
that is saved to the collection.

If you want to extension to be `off` just call

```javascript
Bpmn.instances.off();
```


### API

The extension provides some methods to manage the instances manually and which are also used internally.

Currently the functionality works only without problems on the server.

##### Bpmn.instances.get( instanceId )

Returns a process instance (created by `new Bpmn.Engine` ) that is stored in the cache.
Returns `undefined` if the cache has no instance referenced by the given `indtanceId`.


##### Bpmn.instances.size()

Returns the size of the cache object / the number of cached process instances.

##### Bpmn.instances.has( instanceId )

Returns true if an instance is cached by the given `instanceId` and if the collection has a document with that id.
Otherwise returns false.

##### Bpmn.instances.add({ instanceId, engine })

Adds an existing engine (process instance) to the collection and cache by a given `instanceId`.
Usually it is the `engine.instanceId` property but this way it allows you to alternatively use custom ids (like uuid).

##### Bpmn.instances.remove({ instanceId })

Removes an engine from collection / cache by given `instanceId`

### Collection

The extension ships with a Mongo.Collection and a caching dictionary by default.
The collection and the cache are deleted on each server restart (because the running process instances will also be wiped
from memory and thus all instance reeferences will be null pointers).

If you want to keep your instances persistent you may check out `cquencial:bpmn-persistence`.

