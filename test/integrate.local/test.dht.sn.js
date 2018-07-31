// Copyright (c) 2016-2018, BuckyCloud, Inc. and other BDT contributors.
// The BDT project is supported by the GeekChain Foundation.
// All rights reserved.

// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the BDT nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.

// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
// ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
// WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
// DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY
// DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
// (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
// LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
// ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
// SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

'use strict';

const os = require("os");
const EnvConfig = require('./env_config.js');
const DHTBDTClient = require('./bdt_dht_client.js');
const DHTBDTServer = require('./bdt_dht_server.js');
const NormalBDTClient = require('./normal_bdt_client.js');
const NormalBDTServer = require('./normal_bdt_server.js');
const NormalSN = require('./normal_sn.js');
const SimpleDHT = require('./simple_dht.js');
const DHTSN = require('./sn_dht.js');
const CrashListener = require("../crash_listener.js");

const Base = require('../../base/base.js');
const LOG_INFO = Base.BX_INFO;
const LOG_WARN = Base.BX_WARN;
const LOG_DEBUG = Base.BX_DEBUG;
const LOG_CHECK = Base.BX_CHECK;
const LOG_ASSERT = Base.BX_ASSERT;
const LOG_ERROR = Base.BX_ERROR;

if (require.main === module) {
    // node start.js machineName
    let args = process.argv.slice(2);
    let devName = args[0];
    //devName = '175';

    let crashListener = new CrashListener();
    crashListener.listen();

    let logFolder;
    if (os.platform() === 'win32') {
        logFolder = "D:\\blog\\";
    } else {
        logFolder = "/var/blog/";
    }
    crashListener.enableFileLog(logFolder);
    Base.BX_EnableFileLog(logFolder, `${path.basename(require.main.filename, ".js")}-${devName}`, '.log');

    //EnvConfig.NORMAL_SN_LIST.forEach(sn => {if (sn.dev.name === devName) NormalSN.run(sn);});
    //EnvConfig.SEED_DHT_LIST.forEach(dht => {if (dht.dev.name === devName) SimpleDHT.run(dht);});
    //EnvConfig.SIMPLE_DHT_LIST.forEach(dht => {if (dht.dev.name === devName) SimpleDHT.run(dht);});
    EnvConfig.SN_DHT_LIST.forEach(sn => {if (sn.dev.name === devName) DHTSN.run(sn);});
    //EnvConfig.NORMAL_BDT_SERVER_LIST.forEach(bdt => {if (bdt.dev.name === devName) NormalBDTServer.run(bdt);});
    //EnvConfig.BDT_DHT_SERVER_LIST.forEach(bdt => {if (bdt.dev.name === devName) DHTBDTServer.run(bdt);});
    //EnvConfig.NORMAL_BDT_CLIENT_LIST.forEach(bdt => {if (bdt.dev.name === devName) NormalBDTClient.run(bdt);});
    //EnvConfig.BDT_DHT_CLIENT_LIST.forEach(bdt => {if (bdt.dev.name === devName) DHTBDTClient.run(bdt);});/**/
}
