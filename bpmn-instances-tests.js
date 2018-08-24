/* eslint-env mocha */
import { Bpmn } from 'meteor/cquencial:bpmn-engine';
import { assert } from 'meteor/practicalmeteor:chai';
import { Random } from 'meteor/random';
import {Meteor} from 'meteor/meteor';

const { EventEmitter } = require('events');

const processXml = `
<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <process id="theProcess" isExecutable="true">
    <startEvent id="theStart" />
    <userTask id="userTask" />
    <endEvent id="theEnd" />
    <sequenceFlow id="flow1" sourceRef="theStart" targetRef="userTask" />
    <sequenceFlow id="flow2" sourceRef="userTask" targetRef="theEnd" />
  </process>
</definitions>`;

const processWithUserTask = `
<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <process id="theProcess" isExecutable="true">
    <startEvent id="theStart" />
    <userTask id="userTask" />
    <endEvent id="theEnd" />
    <sequenceFlow id="flow1" sourceRef="theStart" targetRef="userTask" />
    <sequenceFlow id="flow2" sourceRef="userTask" targetRef="theEnd" />
  </process>
</definitions>`;


const Events = {
  start: 'start',
  enter: 'enter',
  end: 'end',
  wait: 'wait',
  leave: 'leave',
  taken: 'taken',
  cancel: 'cancel',
  error: 'error',
  discarded: 'discarded',
};


// used to startup check
let instancesAtStart;
let instancesCachedAtStart;

Meteor.startup(() => {
  console.log("test startzp")
  instancesAtStart = Bpmn.instances.collection.find().count();
  instancesCachedAtStart = Bpmn.instances.size();
});

describe('bpmn-instances', function () {

  const isDefined = function (target, expectedType) {
    assert.isDefined(target);
    assert.equal(typeof target, expectedType, "expected " + expectedType + " got " + typeof target);
  };

  beforeEach(() => {
    Bpmn.instances.on();
  });

  afterEach(() => {
    Bpmn.instances.off();
  });


  describe("Bpmn.instances.has", function () {

    it('returns false if instance does not exists', function () {
      const instanceId = Random.id();
      const expectFalse = Bpmn.instances.has(instanceId);
      assert.isFalse(expectFalse);
    });

    it('returns true if instance exists', function () {
      const engine = new Bpmn.Engine({ source: processXml });
      const insertId = Bpmn.instances.add({ instanceId: engine.instanceId, engine });
      isDefined(insertId, 'string');
      assert.isTrue(Bpmn.instances.has(engine.instanceId));
    });

    it('throws an error of no instanceId is given', function () {
      assert.throws(function () {
        Bpmn.instances.has();
      });
    });
  });

  describe("Bpmn.instances.add", function () {

    it('adds an instance to the cache and collection', function () {
      const engine = new Bpmn.Engine({ source: processXml });
      const { instanceId } = engine;
      isDefined(instanceId, 'string');


      const countBefore = Bpmn.instances.size();
      const insertId = Bpmn.instances.add({ instanceId, engine });
      assert.equal(Bpmn.instances.size(), countBefore + 1);

      const instanceDoc = Bpmn.instances.collection.findOne(insertId);
      assert.equal(instanceDoc.instanceId, instanceId);

      const cachedInstance = Bpmn.instances.get(instanceId);
      assert.equal(cachedInstance.instanceId, engine.instanceId);
    });

    it('adds the engine instance on execute', function (done) {
      const engine = new Bpmn.Engine({ source: processXml });
      engine.execute({}, Meteor.bindEnvironment((err, result) => {
        console.log("after execute callback received")
        Meteor._sleepForMs(100);
        const { instanceId } = engine;
        assert.isTrue(Bpmn.instances.has(instanceId));
        done();
      }));
    });

    it('throws an error if the instance is not a Bpmn.Engine instance', function () {
      assert.throws(() => {
        Bpmn.instances.add({
          instanceId: Random.id(),
        });
      });

      assert.throws(() => {
        Bpmn.instances.add({
          instanceId: Random.id(),
          engine: {},
        });
      });

      assert.throws(() => {
        Bpmn.instances.add({
          instanceId: Random.id(),
          engine: function () {},
        });
      });
    });

    it('throws an error if the instanceId is not given', function () {
      assert.throws(function () {
        Bpmn.instances.add({
          engine: new Bpmn.Engine({ source: processXml }),
        });
      });
      assert.throws(function () {
        Bpmn.instances.add({
          instanceId: '',
          engine: new Bpmn.Engine({ source: processXml }),
        });
      });
    });
  });

  describe("Bpmn.instances.remove", function () {

    it('removes an instance by a given instanceId from cache and collection', function (done) {
      const engine = new Bpmn.Engine({ source: processXml });
      engine.execute({}, Meteor.bindEnvironment(() => {
        Meteor._sleepForMs(100);
        const { instanceId } = engine;
        assert.isTrue(Bpmn.instances.has(instanceId));
        Bpmn.instances.remove({ instanceId });
        assert.isFalse(Bpmn.instances.has(instanceId));
        done();
      }));
    });

    it('throws an error if no instance id found by instanceId', function () {
      assert.throws(function () {
        Bpmn.instances.remove({ instanceId: Random.id() });
      })
      assert.throws(function () {
        Bpmn.instances.remove({});
      })
    });
  });


  describe('Engine.stop', function () {
    it('removes an instance on stop', function (done) {
      const engine = new Bpmn.Engine({
        source: processWithUserTask,
      });
      const {instanceId} = engine;

      const listener = new EventEmitter();
      listener.on('wait', Meteor.bindEnvironment((element, instance) => {
        Meteor._sleepForMs(100);
        assert.isTrue(Bpmn.instances.has(instanceId));
        engine.stop();
        Meteor._sleepForMs(100);
        assert.isFalse(Bpmn.instances.has(instanceId));
        done();
      }));

      engine.execute({
        listener
      });
    });
  });

  describe('Engine.resume', function () {

    it('adds instance on resume', function (done) {
      const engine = new Bpmn.Engine({  source: processWithUserTask ,
        hooks: {
          'instances':{
            onStopAfter() {
              assert.isFalse(Bpmn.instances.has(instanceId));
            }
          }
        }});

      const {instanceId} = engine;

      let state;

      engine.on('end', () => { // TODO on End hooks
        Bpmn.Engine.resume(state, {
          instanceId,
          hooks: {
            'instances': {
              onResumeAfter: Meteor.bindEnvironment(function () {
                Meteor._sleepForMs(100);
                assert.isTrue(Bpmn.instances.has(instanceId));
                done();
              })
            }
          }
        });
      });

      const listener = new EventEmitter();
      listener.on('wait', Meteor.bindEnvironment((element, instance) => {
        state = engine.getState();
        Meteor._sleepForMs(100);
        assert.isTrue(Bpmn.instances.has(engine.instanceId));
        engine.stop();
      }));

      engine.execute({
        listener
      });
    });
  });

  describe('Bpmn.instances.collection', function () {
    it('is empty after startup', function () {
      assert.equal(instancesAtStart, 0);
    });

    it ('has a name', function () {
      isDefined(Bpmn.instances.collection.name, 'string');
    });

    it('has an optional schema definition', function () {
      isDefined(Bpmn.instances.collection.schema, 'object');
    });
  });

  describe('Bpmn.instances cache', function () {

    it('is empty after startup', function () {
      assert.equal(instancesCachedAtStart, 0);
    });
  });
});
