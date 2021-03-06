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

const Base = require('../../base/base.js');
const {EndPoint} = require('../../base/util.js');
const {HashDistance, Result: DHTResult, Config} = require('../util.js');
const Peer = require('../peer.js');
const {TouchNodeConvergenceTask} = require('./task_touch_node_recursion.js');
const DHTPackage = require('../packages/package.js');
const DHTCommandType = DHTPackage.CommandType;
const BaseUtil = require('../../base/util.js');
const TimeHelper = BaseUtil.TimeHelper;

const LOG_TRACE = Base.BX_TRACE;
const LOG_INFO = Base.BX_INFO;
const LOG_WARN = Base.BX_WARN;
const LOG_DEBUG = Base.BX_DEBUG;
const LOG_CHECK = Base.BX_CHECK;
const LOG_ASSERT = Base.BX_ASSERT;
const LOG_ERROR = Base.BX_ERROR;

class FindPeerTask extends TouchNodeConvergenceTask {
    constructor(owner, peerid, isImmediately) {
        super(owner, isImmediately);

        this.m_peerid = peerid;

        this.m_foundPeerList = new Map();

        // 阶段性返回搜索到的节点
        this.m_lastResponseTime = TimeHelper.uptimeMS();
        this.m_stepListeners = [];
        this.m_foundCountLastStep = 0;
        this.m_stepTimer = setInterval(() => {
            let now = TimeHelper.uptimeMS();
            if (now - this.m_lastResponseTime > Config.FindPeer.StepTimeout &&
                this.m_foundPeerList.size !== this.m_foundCountLastStep) {

                this.m_foundCountLastStep = this.m_foundPeerList.size;

                let foundPeerList = [...this.m_foundPeerList.values()];
                HashDistance.sortByDistance(foundPeerList, {hash: HashDistance.checkHash(this.m_peerid)});
        
                let abort = true;
                this.m_stepListeners.forEach(callback => {
                    if (callback) {
                        abort = callback(DHTResult.PENDING, foundPeerList, this.n_nodes) && abort;
                    } else {
                        abort = false;
                    }
                });

                if (abort) {
                    this._onComplete(DHTResult.ABORT);
                }
            }
        }, Config.Task.MaxIdleTimeMS);
    }

    get peerid() {
        return this.m_peerid;
    }

    addStepListener(callback) {
        this.m_stepListeners.push(callback);
    }

    _processImpl(response, remotePeer) {
        LOG_INFO(`LOCALPEER:(${this.bucket.localPeer.peerid}:${this.servicePath}) remotePeer:${response.common.src.peerid} responsed FindPeer(${this.m_peerid})`);
        this.m_lastResponseTime = TimeHelper.uptimeMS();
        // 合并当前使用的address到eplist，然后恢复response内容
        // 如果address是TCP地址，可能没有记录到eplist，但这个地址可能是唯一可用连接地址
        let srcEPList = response.common.src.eplist;
        response.common.src.eplist = remotePeer.eplist;
        if (remotePeer.address) {
            Peer.Peer.unionEplist(response.common.src.eplist, EndPoint.toString(remotePeer.address));
        }
        let foundPeer = new Peer.Peer(response.common.src);
        response.common.src.eplist = srcEPList;

        // 判定该peer是否在该服务子网
        let serviceDescriptor = foundPeer.findService(this.servicePath);
        let isInService = serviceDescriptor && serviceDescriptor.isSigninServer();

        // TODO
        // 集成bdt到chainSDK的时候, 节点需要快速建立和销毁
        // sn 尽量快速返回所有(或尽可能多的peer)
        // 然后让调用方(chainSDK)自己去尝试握手peer,然后connect
        // 后续再想一下更好的方法去做集成的测试
        if ( response.body.n_nodes ) {
            this.n_nodes = response.body.n_nodes;
        }

        if (isInService) {
            this.m_foundPeerList.set(response.common.src.peerid, foundPeer);
        }
        if (isInService && response.common.src.peerid === this.m_peerid) {
            this._onComplete(DHTResult.SUCCESS);
        } else {
            super._processImpl(response, remotePeer);
        }
    }

    _onCompleteImpl(result) {
        LOG_INFO(`LOCALPEER:(${this.bucket.localPeer.peerid}:${this.servicePath}) FindPeer complete:${this.m_foundPeerList.size}`);
        let foundPeerList = [...this.m_foundPeerList.values()];
        HashDistance.sortByDistance(foundPeerList, {hash: HashDistance.checkHash(this.m_peerid)});
        this._callback(result, foundPeerList, this.n_nodes);

        setImmediate(() => {
            this.m_stepListeners = [];
            clearInterval(this.m_stepTimer);
            this.m_stepTimer = null;
            super.destroy();
        });
    }

    _createPackage() {
        let cmdPackage = this.packageFactory.createPackage(DHTCommandType.FIND_PEER_REQ);
        cmdPackage.body = {
            taskid: this.m_id,
            target: this.m_peerid
        };
        return cmdPackage;
    }

    get _targetKey() {
        return this.m_peerid;
    }

    _stopImpl() {
    }
}

module.exports = FindPeerTask;