/*
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
*/

'use strict';
const shim = require('fabric-shim');
const util = require('util');

let Chaincode = class {

  // The Init method is called when the Smart Contract 'diplome' is instantiated by the blockchain network
  // Best practice is to have any Ledger initialization in separate function -- see initLedger()
  async Init(stub) {
    console.info('=========== Instantiated diplome chaincode ===========');
    return shim.success();
  }

  // The Invoke method is called as a result of an application request to run the Smart Contract
  // 'diplome'. The calling application program has also specified the particular smart contract
  // function to be called, with arguments
  async Invoke(stub) {
    let ret = stub.getFunctionAndParameters();
    console.info(ret);

    let method = this[ret.fcn];
    if (!method) {
      console.error('no function of name:' + ret.fcn + ' found');
      throw new Error('Received unknown function ' + ret.fcn + ' invocation');
    }
    try {
      let payload = await method(stub, ret.params);
      return shim.success(payload);
    } catch (err) {
      console.log(err);
      return shim.error(err);
    }
  }

  async queryDiplome(stub, args) {
    if (args.length != 1) {
      throw new Error('Incorrect number of arguments. Expecting DiplomeNumber ex: DIP01');
    }
    let dipNumber = args[0];

    let dipAsBytes = await stub.getState(dipNumber); //get the dip from chaincode state
    if (!dipAsBytes || dipAsBytes.toString().length <= 0) {
      throw new Error(dipNumber + ' does not exist: ');
    }
    console.log(dipAsBytes.toString());
    return dipAsBytes;
  }

  async initLedger(stub, args) {
    console.info('============= START : Initialize Ledger ===========');
    let dips = [];
    dips.push({
      university: 'Yale',
      degree: 'Mathematics',
      spe: 'Finances',
      owner: 'Juan'
    });
    dips.push({
      university: 'ESME',
      degree: 'Hacker',
      spe: 'Exploit',
      owner: 'Nathan'
    });
    dips.push({
      university: 'HEC',
      degree: 'Business',
      spe: 'export',
      owner: 'Marion'
    });
    dips.push({
      university: 'Descartes',
      degree: 'Psyco',
      spe: 'Children Psyco',
      owner: 'Corentine'
    });
    dips.push({
      university: 'Assas',
      degree: 'Law',
      spe: 'Divorce lawyer',
      owner: 'Nassin'
    });
    dips.push({
      university: 'Huston',
      degree: 'Engineer',
      spe: 'Aviation',
      owner: 'Paul'
    });
    dips.push({
      university: 'Paris IV',
      degree: 'Physics',
      spe: 'Quantum',
      owner: 'Sergei'
    });
    dips.push({
      university: 'ESCE',
      degree: 'International business',
      spe: 'Usa Specialist',
      owner: 'Chloe'
    });
    dips.push({
      university: 'IPSA',
      degree: 'Engineer',
      spe: 'Spatial',
      owner: 'Stephen'
    });
    dips.push({
      university: 'Mines Paris',
      degree: 'Engineer',
      spe: 'Agro',
      owner: 'Patrick'
    });

    for (let i = 0; i < dips.length; i++) {
      dips[i].docType = 'dip';
      await stub.putState('DIP' + i, Buffer.from(JSON.stringify(dips[i])));
      console.info('Added <--> ', dips[i]);
    }
    console.info('============= END : Initialize Ledger ===========');
  }

  async createDiplome(stub, args) {
    console.info('============= START : Create Diplome ===========');
    if (args.length != 5) {
      throw new Error('Incorrect number of arguments. Expecting 5');
    }

    var dip = {
      docType: 'dip',
      university: args[1],
      degree: args[2],
      spe: args[3],
      owner: args[4]
    };

    await stub.putState(args[0], Buffer.from(JSON.stringify(dip)));
    console.info('============= END : Create Diplome ===========');
  }

  async queryAllDiplomes(stub, args) {

    let startKey = 'DIP0';
    let endKey = 'DIP999';

    let iterator = await stub.getStateByRange(startKey, endKey);

    let allResults = [];
    while (true) {
      let res = await iterator.next();

      if (res.value && res.value.value.toString()) {
        let jsonRes = {};
        console.log(res.value.value.toString('utf8'));

        jsonRes.Key = res.value.key;
        try {
          jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
        } catch (err) {
          console.log(err);
          jsonRes.Record = res.value.value.toString('utf8');
        }
        allResults.push(jsonRes);
      }
      if (res.done) {
        console.log('end of data');
        await iterator.close();
        console.info(allResults);
        return Buffer.from(JSON.stringify(allResults));
      }
    }
  }

  async changeDiplomeOwner(stub, args) {
    console.info('============= START : changeDiplomeOwner ===========');
    if (args.length != 2) {
      throw new Error('Incorrect number of arguments. Expecting 2');
    }

    let dipAsBytes = await stub.getState(args[0]);
    let dip = JSON.parse(dipAsBytes);
    dip.owner = args[1];

    await stub.putState(args[0], Buffer.from(JSON.stringify(dip)));
    console.info('============= END : changeDiplomeOwner ===========');
  }
};

shim.start(new Chaincode());
