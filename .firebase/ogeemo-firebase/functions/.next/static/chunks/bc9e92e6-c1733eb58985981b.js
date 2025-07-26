"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[4358],{35002:function(e,t,r){r.d(t,{ad:function(){return rG}});var i,n,s,a,o=r(99279),l=r(42680),u=r(19053),h=r(29504),c=r(76552),d=r(4575);r(20357),r(9109).lW;let m="@firebase/firestore",f="4.7.17";/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class g{constructor(e){this.uid=e}isAuthenticated(){return null!=this.uid}toKey(){return this.isAuthenticated()?"uid:"+this.uid:"anonymous-user"}isEqual(e){return e.uid===this.uid}}g.UNAUTHENTICATED=new g(null),g.GOOGLE_CREDENTIALS=new g("google-credentials-uid"),g.FIRST_PARTY=new g("first-party-uid"),g.MOCK_USER=new g("mock-user");/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let p="11.9.0",y=new u.Yd("@firebase/firestore");function v(){return y.logLevel}function E(e,...t){if(y.logLevel<=u.in.DEBUG){let r=t.map(A);y.debug(`Firestore (${p}): ${e}`,...r)}}function w(e,...t){if(y.logLevel<=u.in.ERROR){let r=t.map(A);y.error(`Firestore (${p}): ${e}`,...r)}}function T(e,...t){if(y.logLevel<=u.in.WARN){let r=t.map(A);y.warn(`Firestore (${p}): ${e}`,...r)}}function A(e){if("string"==typeof e)return e;try{/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */return JSON.stringify(e)}catch(t){return e}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function I(e,t,r){let i="Unexpected state";"string"==typeof t?i=t:r=t,N(e,i,r)}function N(e,t,r){let i=`FIRESTORE (${p}) INTERNAL ASSERTION FAILED: ${t} (ID: ${e.toString(16)})`;if(void 0!==r)try{i+=" CONTEXT: "+JSON.stringify(r)}catch(e){i+=" CONTEXT: "+r}throw w(i),Error(i)}function _(e,t,r,i){let n="Unexpected state";"string"==typeof r?n=r:i=r,e||N(t,n,i)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let S={OK:"ok",CANCELLED:"cancelled",UNKNOWN:"unknown",INVALID_ARGUMENT:"invalid-argument",DEADLINE_EXCEEDED:"deadline-exceeded",NOT_FOUND:"not-found",ALREADY_EXISTS:"already-exists",PERMISSION_DENIED:"permission-denied",UNAUTHENTICATED:"unauthenticated",RESOURCE_EXHAUSTED:"resource-exhausted",FAILED_PRECONDITION:"failed-precondition",ABORTED:"aborted",OUT_OF_RANGE:"out-of-range",UNIMPLEMENTED:"unimplemented",INTERNAL:"internal",UNAVAILABLE:"unavailable",DATA_LOSS:"data-loss"};class C extends h.ZR{constructor(e,t){super(e,t),this.code=e,this.message=t,this.toString=()=>`${this.name}: [code=${this.code}]: ${this.message}`}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class k{constructor(){this.promise=new Promise((e,t)=>{this.resolve=e,this.reject=t})}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class D{constructor(e,t){this.user=t,this.type="OAuth",this.headers=new Map,this.headers.set("Authorization",`Bearer ${e}`)}}class x{getToken(){return Promise.resolve(null)}invalidateToken(){}start(e,t){e.enqueueRetryable(()=>t(g.UNAUTHENTICATED))}shutdown(){}}class R{constructor(e){this.token=e,this.changeListener=null}getToken(){return Promise.resolve(this.token)}invalidateToken(){}start(e,t){this.changeListener=t,e.enqueueRetryable(()=>t(this.token.user))}shutdown(){this.changeListener=null}}class V{constructor(e){this.t=e,this.currentUser=g.UNAUTHENTICATED,this.i=0,this.forceRefresh=!1,this.auth=null}start(e,t){_(void 0===this.o,42304);let r=this.i,i=e=>this.i!==r?(r=this.i,t(e)):Promise.resolve(),n=new k;this.o=()=>{this.i++,this.currentUser=this.u(),n.resolve(),n=new k,e.enqueueRetryable(()=>i(this.currentUser))};let s=()=>{let t=n;e.enqueueRetryable(async()=>{await t.promise,await i(this.currentUser)})},a=e=>{E("FirebaseAuthCredentialsProvider","Auth detected"),this.auth=e,this.o&&(this.auth.addAuthTokenListener(this.o),s())};this.t.onInit(e=>a(e)),setTimeout(()=>{if(!this.auth){let e=this.t.getImmediate({optional:!0});e?a(e):(E("FirebaseAuthCredentialsProvider","Auth not yet detected"),n.resolve(),n=new k)}},0),s()}getToken(){let e=this.i,t=this.forceRefresh;return this.forceRefresh=!1,this.auth?this.auth.getToken(t).then(t=>this.i!==e?(E("FirebaseAuthCredentialsProvider","getToken aborted due to token change."),this.getToken()):t?(_("string"==typeof t.accessToken,31837,{l:t}),new D(t.accessToken,this.currentUser)):null):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.auth&&this.o&&this.auth.removeAuthTokenListener(this.o),this.o=void 0}u(){let e=this.auth&&this.auth.getUid();return _(null===e||"string"==typeof e,2055,{h:e}),new g(e)}}class b{constructor(e,t,r){this.P=e,this.T=t,this.I=r,this.type="FirstParty",this.user=g.FIRST_PARTY,this.A=new Map}R(){return this.I?this.I():null}get headers(){this.A.set("X-Goog-AuthUser",this.P);let e=this.R();return e&&this.A.set("Authorization",e),this.T&&this.A.set("X-Goog-Iam-Authorization-Token",this.T),this.A}}class O{constructor(e,t,r){this.P=e,this.T=t,this.I=r}getToken(){return Promise.resolve(new b(this.P,this.T,this.I))}start(e,t){e.enqueueRetryable(()=>t(g.FIRST_PARTY))}shutdown(){}invalidateToken(){}}class L{constructor(e){this.value=e,this.type="AppCheck",this.headers=new Map,e&&e.length>0&&this.headers.set("x-firebase-appcheck",this.value)}}class M{constructor(e,t){this.V=t,this.forceRefresh=!1,this.appCheck=null,this.m=null,this.p=null,(0,o.rh)(e)&&e.settings.appCheckToken&&(this.p=e.settings.appCheckToken)}start(e,t){_(void 0===this.o,3512);let r=e=>{null!=e.error&&E("FirebaseAppCheckTokenProvider",`Error getting App Check token; using placeholder token instead. Error: ${e.error.message}`);let r=e.token!==this.m;return this.m=e.token,E("FirebaseAppCheckTokenProvider",`Received ${r?"new":"existing"} token.`),r?t(e.token):Promise.resolve()};this.o=t=>{e.enqueueRetryable(()=>r(t))};let i=e=>{E("FirebaseAppCheckTokenProvider","AppCheck detected"),this.appCheck=e,this.o&&this.appCheck.addTokenListener(this.o)};this.V.onInit(e=>i(e)),setTimeout(()=>{if(!this.appCheck){let e=this.V.getImmediate({optional:!0});e?i(e):E("FirebaseAppCheckTokenProvider","AppCheck not yet detected")}},0)}getToken(){if(this.p)return Promise.resolve(new L(this.p));let e=this.forceRefresh;return this.forceRefresh=!1,this.appCheck?this.appCheck.getToken(e).then(e=>e?(_("string"==typeof e.token,44558,{tokenResult:e}),this.m=e.token,new L(e.token)):null):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.appCheck&&this.o&&this.appCheck.removeTokenListener(this.o),this.o=void 0}}function F(e,t){return e<t?-1:e>t?1:0}function P(e,t){let r=0;for(;r<e.length&&r<t.length;){let i=e.codePointAt(r),n=t.codePointAt(r);if(i!==n){if(i<128&&n<128)return F(i,n);{let s=new TextEncoder,a=function(e,t){for(let r=0;r<e.length&&r<t.length;++r)if(e[r]!==t[r])return F(e[r],t[r]);return F(e.length,t.length)}(s.encode(U(e,r)),s.encode(U(t,r)));return 0!==a?a:F(i,n)}}r+=i>65535?2:1}return F(e.length,t.length)}function U(e,t){return e.codePointAt(t)>65535?e.substring(t,t+2):e.substring(t,t+1)}function B(e,t,r){return e.length===t.length&&e.every((e,i)=>r(e,t[i]))}class ${static now(){return $.fromMillis(Date.now())}static fromDate(e){return $.fromMillis(e.getTime())}static fromMillis(e){let t=Math.floor(e/1e3);return new $(t,Math.floor((e-1e3*t)*1e6))}constructor(e,t){if(this.seconds=e,this.nanoseconds=t,t<0||t>=1e9)throw new C(S.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+t);if(e<-62135596800||e>=253402300800)throw new C(S.INVALID_ARGUMENT,"Timestamp seconds out of range: "+e)}toDate(){return new Date(this.toMillis())}toMillis(){return 1e3*this.seconds+this.nanoseconds/1e6}_compareTo(e){return this.seconds===e.seconds?F(this.nanoseconds,e.nanoseconds):F(this.seconds,e.seconds)}isEqual(e){return e.seconds===this.seconds&&e.nanoseconds===this.nanoseconds}toString(){return"Timestamp(seconds="+this.seconds+", nanoseconds="+this.nanoseconds+")"}toJSON(){return{seconds:this.seconds,nanoseconds:this.nanoseconds}}valueOf(){return String(this.seconds- -62135596800).padStart(12,"0")+"."+String(this.nanoseconds).padStart(9,"0")}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class q{static fromTimestamp(e){return new q(e)}static min(){return new q(new $(0,0))}static max(){return new q(new $(253402300799,999999999))}constructor(e){this.timestamp=e}compareTo(e){return this.timestamp._compareTo(e.timestamp)}isEqual(e){return this.timestamp.isEqual(e.timestamp)}toMicroseconds(){return 1e6*this.timestamp.seconds+this.timestamp.nanoseconds/1e3}toString(){return"SnapshotVersion("+this.timestamp.toString()+")"}toTimestamp(){return this.timestamp}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let K="__name__";class Q{constructor(e,t,r){void 0===t?t=0:t>e.length&&I(637,{offset:t,range:e.length}),void 0===r?r=e.length-t:r>e.length-t&&I(1746,{length:r,range:e.length-t}),this.segments=e,this.offset=t,this.len=r}get length(){return this.len}isEqual(e){return 0===Q.comparator(this,e)}child(e){let t=this.segments.slice(this.offset,this.limit());return e instanceof Q?e.forEach(e=>{t.push(e)}):t.push(e),this.construct(t)}limit(){return this.offset+this.length}popFirst(e){return e=void 0===e?1:e,this.construct(this.segments,this.offset+e,this.length-e)}popLast(){return this.construct(this.segments,this.offset,this.length-1)}firstSegment(){return this.segments[this.offset]}lastSegment(){return this.get(this.length-1)}get(e){return this.segments[this.offset+e]}isEmpty(){return 0===this.length}isPrefixOf(e){if(e.length<this.length)return!1;for(let t=0;t<this.length;t++)if(this.get(t)!==e.get(t))return!1;return!0}isImmediateParentOf(e){if(this.length+1!==e.length)return!1;for(let t=0;t<this.length;t++)if(this.get(t)!==e.get(t))return!1;return!0}forEach(e){for(let t=this.offset,r=this.limit();t<r;t++)e(this.segments[t])}toArray(){return this.segments.slice(this.offset,this.limit())}static comparator(e,t){let r=Math.min(e.length,t.length);for(let i=0;i<r;i++){let r=Q.compareSegments(e.get(i),t.get(i));if(0!==r)return r}return F(e.length,t.length)}static compareSegments(e,t){let r=Q.isNumericId(e),i=Q.isNumericId(t);return r&&!i?-1:!r&&i?1:r&&i?Q.extractNumericId(e).compare(Q.extractNumericId(t)):P(e,t)}static isNumericId(e){return e.startsWith("__id")&&e.endsWith("__")}static extractNumericId(e){return c.z8.fromString(e.substring(4,e.length-2))}}class z extends Q{construct(e,t,r){return new z(e,t,r)}canonicalString(){return this.toArray().join("/")}toString(){return this.canonicalString()}toUriEncodedString(){return this.toArray().map(encodeURIComponent).join("/")}static fromString(...e){let t=[];for(let r of e){if(r.indexOf("//")>=0)throw new C(S.INVALID_ARGUMENT,`Invalid segment (${r}). Paths must not contain // in them.`);t.push(...r.split("/").filter(e=>e.length>0))}return new z(t)}static emptyPath(){return new z([])}}let G=/^[_a-zA-Z][_a-zA-Z0-9]*$/;class j extends Q{construct(e,t,r){return new j(e,t,r)}static isValidIdentifier(e){return G.test(e)}canonicalString(){return this.toArray().map(e=>(e=e.replace(/\\/g,"\\\\").replace(/`/g,"\\`"),j.isValidIdentifier(e)||(e="`"+e+"`"),e)).join(".")}toString(){return this.canonicalString()}isKeyField(){return 1===this.length&&this.get(0)===K}static keyField(){return new j([K])}static fromServerFormat(e){let t=[],r="",i=0,n=()=>{if(0===r.length)throw new C(S.INVALID_ARGUMENT,`Invalid field path (${e}). Paths must not be empty, begin with '.', end with '.', or contain '..'`);t.push(r),r=""},s=!1;for(;i<e.length;){let t=e[i];if("\\"===t){if(i+1===e.length)throw new C(S.INVALID_ARGUMENT,"Path has trailing escape character: "+e);let t=e[i+1];if("\\"!==t&&"."!==t&&"`"!==t)throw new C(S.INVALID_ARGUMENT,"Path has invalid escape sequence: "+e);r+=t,i+=2}else"`"===t?s=!s:"."!==t||s?r+=t:n(),i++}if(n(),s)throw new C(S.INVALID_ARGUMENT,"Unterminated ` in path: "+e);return new j(t)}static emptyPath(){return new j([])}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class H{constructor(e){this.path=e}static fromPath(e){return new H(z.fromString(e))}static fromName(e){return new H(z.fromString(e).popFirst(5))}static empty(){return new H(z.emptyPath())}get collectionGroup(){return this.path.popLast().lastSegment()}hasCollectionId(e){return this.path.length>=2&&this.path.get(this.path.length-2)===e}getCollectionGroup(){return this.path.get(this.path.length-2)}getCollectionPath(){return this.path.popLast()}isEqual(e){return null!==e&&0===z.comparator(this.path,e.path)}toString(){return this.path.toString()}static comparator(e,t){return z.comparator(e.path,t.path)}static isDocumentKey(e){return e.length%2==0}static fromSegments(e){return new H(new z(e.slice()))}}class X{constructor(e,t,r,i){this.indexId=e,this.collectionGroup=t,this.fields=r,this.indexState=i}}X.UNKNOWN_ID=-1;class Y{constructor(e,t,r){this.readTime=e,this.documentKey=t,this.largestBatchId=r}static min(){return new Y(q.min(),H.empty(),-1)}static max(){return new Y(q.max(),H.empty(),-1)}}class W{constructor(){this.onCommittedListeners=[]}addOnCommittedListener(e){this.onCommittedListeners.push(e)}raiseOnCommittedEvent(){this.onCommittedListeners.forEach(e=>e())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class J{constructor(e){this.nextCallback=null,this.catchCallback=null,this.result=void 0,this.error=void 0,this.isDone=!1,this.callbackAttached=!1,e(e=>{this.isDone=!0,this.result=e,this.nextCallback&&this.nextCallback(e)},e=>{this.isDone=!0,this.error=e,this.catchCallback&&this.catchCallback(e)})}catch(e){return this.next(void 0,e)}next(e,t){return this.callbackAttached&&I(59440),this.callbackAttached=!0,this.isDone?this.error?this.wrapFailure(t,this.error):this.wrapSuccess(e,this.result):new J((r,i)=>{this.nextCallback=t=>{this.wrapSuccess(e,t).next(r,i)},this.catchCallback=e=>{this.wrapFailure(t,e).next(r,i)}})}toPromise(){return new Promise((e,t)=>{this.next(e,t)})}wrapUserFunction(e){try{let t=e();return t instanceof J?t:J.resolve(t)}catch(e){return J.reject(e)}}wrapSuccess(e,t){return e?this.wrapUserFunction(()=>e(t)):J.resolve(t)}wrapFailure(e,t){return e?this.wrapUserFunction(()=>e(t)):J.reject(t)}static resolve(e){return new J((t,r)=>{t(e)})}static reject(e){return new J((t,r)=>{r(e)})}static waitFor(e){return new J((t,r)=>{let i=0,n=0,s=!1;e.forEach(e=>{++i,e.next(()=>{++n,s&&n===i&&t()},e=>r(e))}),s=!0,n===i&&t()})}static or(e){let t=J.resolve(!1);for(let r of e)t=t.next(e=>e?J.resolve(e):r());return t}static forEach(e,t){let r=[];return e.forEach((e,i)=>{r.push(t.call(this,e,i))}),this.waitFor(r)}static mapArray(e,t){return new J((r,i)=>{let n=e.length,s=Array(n),a=0;for(let o=0;o<n;o++){let l=o;t(e[l]).next(e=>{s[l]=e,++a===n&&r(s)},e=>i(e))}})}static doWhile(e,t){return new J((r,i)=>{let n=()=>{!0===e()?t().next(()=>{n()},i):r()};n()})}}function Z(e){return"IndexedDbTransactionError"===e.name}/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ee{constructor(e,t){this.previousValue=e,t&&(t.sequenceNumberHandler=e=>this.ue(e),this.ce=e=>t.writeSequenceNumber(e))}ue(e){return this.previousValue=Math.max(e,this.previousValue),this.previousValue}next(){let e=++this.previousValue;return this.ce&&this.ce(e),e}}function et(e){return 0===e&&1/e==-1/0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function er(e){let t=0;for(let r in e)Object.prototype.hasOwnProperty.call(e,r)&&t++;return t}function ei(e,t){for(let r in e)Object.prototype.hasOwnProperty.call(e,r)&&t(r,e[r])}ee.le=-1;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class en{constructor(e,t){this.comparator=e,this.root=t||ea.EMPTY}insert(e,t){return new en(this.comparator,this.root.insert(e,t,this.comparator).copy(null,null,ea.BLACK,null,null))}remove(e){return new en(this.comparator,this.root.remove(e,this.comparator).copy(null,null,ea.BLACK,null,null))}get(e){let t=this.root;for(;!t.isEmpty();){let r=this.comparator(e,t.key);if(0===r)return t.value;r<0?t=t.left:r>0&&(t=t.right)}return null}indexOf(e){let t=0,r=this.root;for(;!r.isEmpty();){let i=this.comparator(e,r.key);if(0===i)return t+r.left.size;i<0?r=r.left:(t+=r.left.size+1,r=r.right)}return -1}isEmpty(){return this.root.isEmpty()}get size(){return this.root.size}minKey(){return this.root.minKey()}maxKey(){return this.root.maxKey()}inorderTraversal(e){return this.root.inorderTraversal(e)}forEach(e){this.inorderTraversal((t,r)=>(e(t,r),!1))}toString(){let e=[];return this.inorderTraversal((t,r)=>(e.push(`${t}:${r}`),!1)),`{${e.join(", ")}}`}reverseTraversal(e){return this.root.reverseTraversal(e)}getIterator(){return new es(this.root,null,this.comparator,!1)}getIteratorFrom(e){return new es(this.root,e,this.comparator,!1)}getReverseIterator(){return new es(this.root,null,this.comparator,!0)}getReverseIteratorFrom(e){return new es(this.root,e,this.comparator,!0)}}class es{constructor(e,t,r,i){this.isReverse=i,this.nodeStack=[];let n=1;for(;!e.isEmpty();)if(n=t?r(e.key,t):1,t&&i&&(n*=-1),n<0)e=this.isReverse?e.left:e.right;else{if(0===n){this.nodeStack.push(e);break}this.nodeStack.push(e),e=this.isReverse?e.right:e.left}}getNext(){let e=this.nodeStack.pop(),t={key:e.key,value:e.value};if(this.isReverse)for(e=e.left;!e.isEmpty();)this.nodeStack.push(e),e=e.right;else for(e=e.right;!e.isEmpty();)this.nodeStack.push(e),e=e.left;return t}hasNext(){return this.nodeStack.length>0}peek(){if(0===this.nodeStack.length)return null;let e=this.nodeStack[this.nodeStack.length-1];return{key:e.key,value:e.value}}}class ea{constructor(e,t,r,i,n){this.key=e,this.value=t,this.color=null!=r?r:ea.RED,this.left=null!=i?i:ea.EMPTY,this.right=null!=n?n:ea.EMPTY,this.size=this.left.size+1+this.right.size}copy(e,t,r,i,n){return new ea(null!=e?e:this.key,null!=t?t:this.value,null!=r?r:this.color,null!=i?i:this.left,null!=n?n:this.right)}isEmpty(){return!1}inorderTraversal(e){return this.left.inorderTraversal(e)||e(this.key,this.value)||this.right.inorderTraversal(e)}reverseTraversal(e){return this.right.reverseTraversal(e)||e(this.key,this.value)||this.left.reverseTraversal(e)}min(){return this.left.isEmpty()?this:this.left.min()}minKey(){return this.min().key}maxKey(){return this.right.isEmpty()?this.key:this.right.maxKey()}insert(e,t,r){let i=this,n=r(e,i.key);return(i=n<0?i.copy(null,null,null,i.left.insert(e,t,r),null):0===n?i.copy(null,t,null,null,null):i.copy(null,null,null,null,i.right.insert(e,t,r))).fixUp()}removeMin(){if(this.left.isEmpty())return ea.EMPTY;let e=this;return e.left.isRed()||e.left.left.isRed()||(e=e.moveRedLeft()),(e=e.copy(null,null,null,e.left.removeMin(),null)).fixUp()}remove(e,t){let r,i=this;if(0>t(e,i.key))i.left.isEmpty()||i.left.isRed()||i.left.left.isRed()||(i=i.moveRedLeft()),i=i.copy(null,null,null,i.left.remove(e,t),null);else{if(i.left.isRed()&&(i=i.rotateRight()),i.right.isEmpty()||i.right.isRed()||i.right.left.isRed()||(i=i.moveRedRight()),0===t(e,i.key)){if(i.right.isEmpty())return ea.EMPTY;r=i.right.min(),i=i.copy(r.key,r.value,null,null,i.right.removeMin())}i=i.copy(null,null,null,null,i.right.remove(e,t))}return i.fixUp()}isRed(){return this.color}fixUp(){let e=this;return e.right.isRed()&&!e.left.isRed()&&(e=e.rotateLeft()),e.left.isRed()&&e.left.left.isRed()&&(e=e.rotateRight()),e.left.isRed()&&e.right.isRed()&&(e=e.colorFlip()),e}moveRedLeft(){let e=this.colorFlip();return e.right.left.isRed()&&(e=(e=(e=e.copy(null,null,null,null,e.right.rotateRight())).rotateLeft()).colorFlip()),e}moveRedRight(){let e=this.colorFlip();return e.left.left.isRed()&&(e=(e=e.rotateRight()).colorFlip()),e}rotateLeft(){let e=this.copy(null,null,ea.RED,null,this.right.left);return this.right.copy(null,null,this.color,e,null)}rotateRight(){let e=this.copy(null,null,ea.RED,this.left.right,null);return this.left.copy(null,null,this.color,null,e)}colorFlip(){let e=this.left.copy(null,null,!this.left.color,null,null),t=this.right.copy(null,null,!this.right.color,null,null);return this.copy(null,null,!this.color,e,t)}checkMaxDepth(){return Math.pow(2,this.check())<=this.size+1}check(){if(this.isRed()&&this.left.isRed())throw I(43730,{key:this.key,value:this.value});if(this.right.isRed())throw I(14113,{key:this.key,value:this.value});let e=this.left.check();if(e!==this.right.check())throw I(27949);return e+(this.isRed()?0:1)}}ea.EMPTY=null,ea.RED=!0,ea.BLACK=!1,ea.EMPTY=new class{constructor(){this.size=0}get key(){throw I(57766)}get value(){throw I(16141)}get color(){throw I(16727)}get left(){throw I(29726)}get right(){throw I(36894)}copy(e,t,r,i,n){return this}insert(e,t,r){return new ea(e,t)}remove(e,t){return this}isEmpty(){return!0}inorderTraversal(e){return!1}reverseTraversal(e){return!1}minKey(){return null}maxKey(){return null}isRed(){return!1}checkMaxDepth(){return!0}check(){return 0}};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class eo{constructor(e){this.comparator=e,this.data=new en(this.comparator)}has(e){return null!==this.data.get(e)}first(){return this.data.minKey()}last(){return this.data.maxKey()}get size(){return this.data.size}indexOf(e){return this.data.indexOf(e)}forEach(e){this.data.inorderTraversal((t,r)=>(e(t),!1))}forEachInRange(e,t){let r=this.data.getIteratorFrom(e[0]);for(;r.hasNext();){let i=r.getNext();if(this.comparator(i.key,e[1])>=0)return;t(i.key)}}forEachWhile(e,t){let r;for(r=void 0!==t?this.data.getIteratorFrom(t):this.data.getIterator();r.hasNext();)if(!e(r.getNext().key))return}firstAfterOrEqual(e){let t=this.data.getIteratorFrom(e);return t.hasNext()?t.getNext().key:null}getIterator(){return new el(this.data.getIterator())}getIteratorFrom(e){return new el(this.data.getIteratorFrom(e))}add(e){return this.copy(this.data.remove(e).insert(e,!0))}delete(e){return this.has(e)?this.copy(this.data.remove(e)):this}isEmpty(){return this.data.isEmpty()}unionWith(e){let t=this;return t.size<e.size&&(t=e,e=this),e.forEach(e=>{t=t.add(e)}),t}isEqual(e){if(!(e instanceof eo)||this.size!==e.size)return!1;let t=this.data.getIterator(),r=e.data.getIterator();for(;t.hasNext();){let e=t.getNext().key,i=r.getNext().key;if(0!==this.comparator(e,i))return!1}return!0}toArray(){let e=[];return this.forEach(t=>{e.push(t)}),e}toString(){let e=[];return this.forEach(t=>e.push(t)),"SortedSet("+e.toString()+")"}copy(e){let t=new eo(this.comparator);return t.data=e,t}}class el{constructor(e){this.iter=e}getNext(){return this.iter.getNext().key}hasNext(){return this.iter.hasNext()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class eu{constructor(e){this.fields=e,e.sort(j.comparator)}static empty(){return new eu([])}unionWith(e){let t=new eo(j.comparator);for(let e of this.fields)t=t.add(e);for(let r of e)t=t.add(r);return new eu(t.toArray())}covers(e){for(let t of this.fields)if(t.isPrefixOf(e))return!0;return!1}isEqual(e){return B(this.fields,e.fields,(e,t)=>e.isEqual(t))}}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class eh extends Error{constructor(){super(...arguments),this.name="Base64DecodeError"}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ec{constructor(e){this.binaryString=e}static fromBase64String(e){return new ec(function(e){try{return atob(e)}catch(e){throw"undefined"!=typeof DOMException&&e instanceof DOMException?new eh("Invalid base64 string: "+e):e}}(e))}static fromUint8Array(e){return new ec(function(e){let t="";for(let r=0;r<e.length;++r)t+=String.fromCharCode(e[r]);return t}(e))}[Symbol.iterator](){let e=0;return{next:()=>e<this.binaryString.length?{value:this.binaryString.charCodeAt(e++),done:!1}:{value:void 0,done:!0}}}toBase64(){return btoa(this.binaryString)}toUint8Array(){return function(e){let t=new Uint8Array(e.length);for(let r=0;r<e.length;r++)t[r]=e.charCodeAt(r);return t}(this.binaryString)}approximateByteSize(){return 2*this.binaryString.length}compareTo(e){return F(this.binaryString,e.binaryString)}isEqual(e){return this.binaryString===e.binaryString}}ec.EMPTY_BYTE_STRING=new ec("");let ed=new RegExp(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.(\d+))?Z$/);function em(e){if(_(!!e,39018),"string"==typeof e){let t=0,r=ed.exec(e);if(_(!!r,46558,{timestamp:e}),r[1]){let e=r[1];t=Number(e=(e+"000000000").substr(0,9))}return{seconds:Math.floor(new Date(e).getTime()/1e3),nanos:t}}return{seconds:ef(e.seconds),nanos:ef(e.nanos)}}function ef(e){return"number"==typeof e?e:"string"==typeof e?Number(e):0}function eg(e){return"string"==typeof e?ec.fromBase64String(e):ec.fromUint8Array(e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let ep="server_timestamp",ey="__type__",ev="__previous_value__",eE="__local_write_time__";function ew(e){var t,r;return(null===(r=((null===(t=null==e?void 0:e.mapValue)||void 0===t?void 0:t.fields)||{})[ey])||void 0===r?void 0:r.stringValue)===ep}function eT(e){let t=em(e.mapValue.fields[eE].timestampValue);return new $(t.seconds,t.nanos)}let eA="(default)";class eI{constructor(e,t){this.projectId=e,this.database=t||eA}static empty(){return new eI("","")}get isDefaultDatabase(){return this.database===eA}isEqual(e){return e instanceof eI&&e.projectId===this.projectId&&e.database===this.database}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let eN="__max__",e_={mapValue:{fields:{__type__:{stringValue:eN}}}},eS="value";function eC(e){return"nullValue"in e?0:"booleanValue"in e?1:"integerValue"in e||"doubleValue"in e?2:"timestampValue"in e?3:"stringValue"in e?5:"bytesValue"in e?6:"referenceValue"in e?7:"geoPointValue"in e?8:"arrayValue"in e?9:"mapValue"in e?ew(e)?4:eU(e)?9007199254740991:eF(e)?10:11:I(28295,{value:e})}function ek(e,t){if(e===t)return!0;let r=eC(e);if(r!==eC(t))return!1;switch(r){case 0:case 9007199254740991:return!0;case 1:return e.booleanValue===t.booleanValue;case 4:return eT(e).isEqual(eT(t));case 3:return function(e,t){if("string"==typeof e.timestampValue&&"string"==typeof t.timestampValue&&e.timestampValue.length===t.timestampValue.length)return e.timestampValue===t.timestampValue;let r=em(e.timestampValue),i=em(t.timestampValue);return r.seconds===i.seconds&&r.nanos===i.nanos}(e,t);case 5:return e.stringValue===t.stringValue;case 6:return eg(e.bytesValue).isEqual(eg(t.bytesValue));case 7:return e.referenceValue===t.referenceValue;case 8:return ef(e.geoPointValue.latitude)===ef(t.geoPointValue.latitude)&&ef(e.geoPointValue.longitude)===ef(t.geoPointValue.longitude);case 2:return function(e,t){if("integerValue"in e&&"integerValue"in t)return ef(e.integerValue)===ef(t.integerValue);if("doubleValue"in e&&"doubleValue"in t){let r=ef(e.doubleValue),i=ef(t.doubleValue);return r===i?et(r)===et(i):isNaN(r)&&isNaN(i)}return!1}(e,t);case 9:return B(e.arrayValue.values||[],t.arrayValue.values||[],ek);case 10:case 11:return function(e,t){let r=e.mapValue.fields||{},i=t.mapValue.fields||{};if(er(r)!==er(i))return!1;for(let e in r)if(r.hasOwnProperty(e)&&(void 0===i[e]||!ek(r[e],i[e])))return!1;return!0}(e,t);default:return I(52216,{left:e})}}function eD(e,t){return void 0!==(e.values||[]).find(e=>ek(e,t))}function ex(e,t){if(e===t)return 0;let r=eC(e),i=eC(t);if(r!==i)return F(r,i);switch(r){case 0:case 9007199254740991:return 0;case 1:return F(e.booleanValue,t.booleanValue);case 2:return function(e,t){let r=ef(e.integerValue||e.doubleValue),i=ef(t.integerValue||t.doubleValue);return r<i?-1:r>i?1:r===i?0:isNaN(r)?isNaN(i)?0:-1:1}(e,t);case 3:return eR(e.timestampValue,t.timestampValue);case 4:return eR(eT(e),eT(t));case 5:return P(e.stringValue,t.stringValue);case 6:return function(e,t){let r=eg(e),i=eg(t);return r.compareTo(i)}(e.bytesValue,t.bytesValue);case 7:return function(e,t){let r=e.split("/"),i=t.split("/");for(let e=0;e<r.length&&e<i.length;e++){let t=F(r[e],i[e]);if(0!==t)return t}return F(r.length,i.length)}(e.referenceValue,t.referenceValue);case 8:return function(e,t){let r=F(ef(e.latitude),ef(t.latitude));return 0!==r?r:F(ef(e.longitude),ef(t.longitude))}(e.geoPointValue,t.geoPointValue);case 9:return eV(e.arrayValue,t.arrayValue);case 10:return function(e,t){var r,i,n,s;let a=e.fields||{},o=t.fields||{},l=null===(r=a[eS])||void 0===r?void 0:r.arrayValue,u=null===(i=o[eS])||void 0===i?void 0:i.arrayValue,h=F((null===(n=null==l?void 0:l.values)||void 0===n?void 0:n.length)||0,(null===(s=null==u?void 0:u.values)||void 0===s?void 0:s.length)||0);return 0!==h?h:eV(l,u)}(e.mapValue,t.mapValue);case 11:return function(e,t){if(e===e_.mapValue&&t===e_.mapValue)return 0;if(e===e_.mapValue)return 1;if(t===e_.mapValue)return -1;let r=e.fields||{},i=Object.keys(r),n=t.fields||{},s=Object.keys(n);i.sort(),s.sort();for(let e=0;e<i.length&&e<s.length;++e){let t=P(i[e],s[e]);if(0!==t)return t;let a=ex(r[i[e]],n[s[e]]);if(0!==a)return a}return F(i.length,s.length)}(e.mapValue,t.mapValue);default:throw I(23264,{Pe:r})}}function eR(e,t){if("string"==typeof e&&"string"==typeof t&&e.length===t.length)return F(e,t);let r=em(e),i=em(t),n=F(r.seconds,i.seconds);return 0!==n?n:F(r.nanos,i.nanos)}function eV(e,t){let r=e.values||[],i=t.values||[];for(let e=0;e<r.length&&e<i.length;++e){let t=ex(r[e],i[e]);if(t)return t}return F(r.length,i.length)}function eb(e){var t,r;return"nullValue"in e?"null":"booleanValue"in e?""+e.booleanValue:"integerValue"in e?""+e.integerValue:"doubleValue"in e?""+e.doubleValue:"timestampValue"in e?function(e){let t=em(e);return`time(${t.seconds},${t.nanos})`}(e.timestampValue):"stringValue"in e?e.stringValue:"bytesValue"in e?eg(e.bytesValue).toBase64():"referenceValue"in e?(t=e.referenceValue,H.fromName(t).toString()):"geoPointValue"in e?(r=e.geoPointValue,`geo(${r.latitude},${r.longitude})`):"arrayValue"in e?function(e){let t="[",r=!0;for(let i of e.values||[])r?r=!1:t+=",",t+=eb(i);return t+"]"}(e.arrayValue):"mapValue"in e?function(e){let t=Object.keys(e.fields||{}).sort(),r="{",i=!0;for(let n of t)i?i=!1:r+=",",r+=`${n}:${eb(e.fields[n])}`;return r+"}"}(e.mapValue):I(61005,{value:e})}function eO(e){return!!e&&"integerValue"in e}function eL(e){return!!e&&"arrayValue"in e}function eM(e){return!!e&&"mapValue"in e}function eF(e){var t,r;return(null===(r=((null===(t=null==e?void 0:e.mapValue)||void 0===t?void 0:t.fields)||{}).__type__)||void 0===r?void 0:r.stringValue)==="__vector__"}function eP(e){if(e.geoPointValue)return{geoPointValue:Object.assign({},e.geoPointValue)};if(e.timestampValue&&"object"==typeof e.timestampValue)return{timestampValue:Object.assign({},e.timestampValue)};if(e.mapValue){let t={mapValue:{fields:{}}};return ei(e.mapValue.fields,(e,r)=>t.mapValue.fields[e]=eP(r)),t}if(e.arrayValue){let t={arrayValue:{values:[]}};for(let r=0;r<(e.arrayValue.values||[]).length;++r)t.arrayValue.values[r]=eP(e.arrayValue.values[r]);return t}return Object.assign({},e)}function eU(e){return(((e.mapValue||{}).fields||{}).__type__||{}).stringValue===eN}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class eB{constructor(e){this.value=e}static empty(){return new eB({mapValue:{}})}field(e){if(e.isEmpty())return this.value;{let t=this.value;for(let r=0;r<e.length-1;++r)if(!eM(t=(t.mapValue.fields||{})[e.get(r)]))return null;return(t=(t.mapValue.fields||{})[e.lastSegment()])||null}}set(e,t){this.getFieldsMap(e.popLast())[e.lastSegment()]=eP(t)}setAll(e){let t=j.emptyPath(),r={},i=[];e.forEach((e,n)=>{if(!t.isImmediateParentOf(n)){let e=this.getFieldsMap(t);this.applyChanges(e,r,i),r={},i=[],t=n.popLast()}e?r[n.lastSegment()]=eP(e):i.push(n.lastSegment())});let n=this.getFieldsMap(t);this.applyChanges(n,r,i)}delete(e){let t=this.field(e.popLast());eM(t)&&t.mapValue.fields&&delete t.mapValue.fields[e.lastSegment()]}isEqual(e){return ek(this.value,e.value)}getFieldsMap(e){let t=this.value;t.mapValue.fields||(t.mapValue={fields:{}});for(let r=0;r<e.length;++r){let i=t.mapValue.fields[e.get(r)];eM(i)&&i.mapValue.fields||(i={mapValue:{fields:{}}},t.mapValue.fields[e.get(r)]=i),t=i}return t.mapValue.fields}applyChanges(e,t,r){for(let i of(ei(t,(t,r)=>e[t]=r),r))delete e[i]}clone(){return new eB(eP(this.value))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class e${constructor(e,t,r,i,n,s,a){this.key=e,this.documentType=t,this.version=r,this.readTime=i,this.createTime=n,this.data=s,this.documentState=a}static newInvalidDocument(e){return new e$(e,0,q.min(),q.min(),q.min(),eB.empty(),0)}static newFoundDocument(e,t,r,i){return new e$(e,1,t,q.min(),r,i,0)}static newNoDocument(e,t){return new e$(e,2,t,q.min(),q.min(),eB.empty(),0)}static newUnknownDocument(e,t){return new e$(e,3,t,q.min(),q.min(),eB.empty(),2)}convertToFoundDocument(e,t){return this.createTime.isEqual(q.min())&&(2===this.documentType||0===this.documentType)&&(this.createTime=e),this.version=e,this.documentType=1,this.data=t,this.documentState=0,this}convertToNoDocument(e){return this.version=e,this.documentType=2,this.data=eB.empty(),this.documentState=0,this}convertToUnknownDocument(e){return this.version=e,this.documentType=3,this.data=eB.empty(),this.documentState=2,this}setHasCommittedMutations(){return this.documentState=2,this}setHasLocalMutations(){return this.documentState=1,this.version=q.min(),this}setReadTime(e){return this.readTime=e,this}get hasLocalMutations(){return 1===this.documentState}get hasCommittedMutations(){return 2===this.documentState}get hasPendingWrites(){return this.hasLocalMutations||this.hasCommittedMutations}isValidDocument(){return 0!==this.documentType}isFoundDocument(){return 1===this.documentType}isNoDocument(){return 2===this.documentType}isUnknownDocument(){return 3===this.documentType}isEqual(e){return e instanceof e$&&this.key.isEqual(e.key)&&this.version.isEqual(e.version)&&this.documentType===e.documentType&&this.documentState===e.documentState&&this.data.isEqual(e.data)}mutableCopy(){return new e$(this.key,this.documentType,this.version,this.readTime,this.createTime,this.data.clone(),this.documentState)}toString(){return`Document(${this.key}, ${this.version}, ${JSON.stringify(this.data.value)}, {createTime: ${this.createTime}}), {documentType: ${this.documentType}}), {documentState: ${this.documentState}})`}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class eq{constructor(e,t){this.position=e,this.inclusive=t}}function eK(e,t,r){let i=0;for(let n=0;n<e.position.length;n++){let s=t[n],a=e.position[n];if(i=s.field.isKeyField()?H.comparator(H.fromName(a.referenceValue),r.key):ex(a,r.data.field(s.field)),"desc"===s.dir&&(i*=-1),0!==i)break}return i}function eQ(e,t){if(null===e)return null===t;if(null===t||e.inclusive!==t.inclusive||e.position.length!==t.position.length)return!1;for(let r=0;r<e.position.length;r++)if(!ek(e.position[r],t.position[r]))return!1;return!0}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ez{constructor(e,t="asc"){this.field=e,this.dir=t}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class eG{}class ej extends eG{constructor(e,t,r){super(),this.field=e,this.op=t,this.value=r}static create(e,t,r){return e.isKeyField()?"in"===t||"not-in"===t?this.createKeyFieldInFilter(e,t,r):new eW(e,t,r):"array-contains"===t?new e1(e,r):"in"===t?new e2(e,r):"not-in"===t?new e5(e,r):"array-contains-any"===t?new e9(e,r):new ej(e,t,r)}static createKeyFieldInFilter(e,t,r){return"in"===t?new eJ(e,r):new eZ(e,r)}matches(e){let t=e.data.field(this.field);return"!="===this.op?null!==t&&void 0===t.nullValue&&this.matchesComparison(ex(t,this.value)):null!==t&&eC(this.value)===eC(t)&&this.matchesComparison(ex(t,this.value))}matchesComparison(e){switch(this.op){case"<":return e<0;case"<=":return e<=0;case"==":return 0===e;case"!=":return 0!==e;case">":return e>0;case">=":return e>=0;default:return I(47266,{operator:this.op})}}isInequality(){return["<","<=",">",">=","!=","not-in"].indexOf(this.op)>=0}getFlattenedFilters(){return[this]}getFilters(){return[this]}}class eH extends eG{constructor(e,t){super(),this.filters=e,this.op=t,this.Te=null}static create(e,t){return new eH(e,t)}matches(e){return eX(this)?void 0===this.filters.find(t=>!t.matches(e)):void 0!==this.filters.find(t=>t.matches(e))}getFlattenedFilters(){return null!==this.Te||(this.Te=this.filters.reduce((e,t)=>e.concat(t.getFlattenedFilters()),[])),this.Te}getFilters(){return Object.assign([],this.filters)}}function eX(e){return"and"===e.op}function eY(e){for(let t of e.filters)if(t instanceof eH)return!1;return!0}class eW extends ej{constructor(e,t,r){super(e,t,r),this.key=H.fromName(r.referenceValue)}matches(e){let t=H.comparator(e.key,this.key);return this.matchesComparison(t)}}class eJ extends ej{constructor(e,t){super(e,"in",t),this.keys=e0("in",t)}matches(e){return this.keys.some(t=>t.isEqual(e.key))}}class eZ extends ej{constructor(e,t){super(e,"not-in",t),this.keys=e0("not-in",t)}matches(e){return!this.keys.some(t=>t.isEqual(e.key))}}function e0(e,t){var r;return((null===(r=t.arrayValue)||void 0===r?void 0:r.values)||[]).map(e=>H.fromName(e.referenceValue))}class e1 extends ej{constructor(e,t){super(e,"array-contains",t)}matches(e){let t=e.data.field(this.field);return eL(t)&&eD(t.arrayValue,this.value)}}class e2 extends ej{constructor(e,t){super(e,"in",t)}matches(e){let t=e.data.field(this.field);return null!==t&&eD(this.value.arrayValue,t)}}class e5 extends ej{constructor(e,t){super(e,"not-in",t)}matches(e){if(eD(this.value.arrayValue,{nullValue:"NULL_VALUE"}))return!1;let t=e.data.field(this.field);return null!==t&&void 0===t.nullValue&&!eD(this.value.arrayValue,t)}}class e9 extends ej{constructor(e,t){super(e,"array-contains-any",t)}matches(e){let t=e.data.field(this.field);return!(!eL(t)||!t.arrayValue.values)&&t.arrayValue.values.some(e=>eD(this.value.arrayValue,e))}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class e4{constructor(e,t=null,r=[],i=[],n=null,s=null,a=null){this.path=e,this.collectionGroup=t,this.orderBy=r,this.filters=i,this.limit=n,this.startAt=s,this.endAt=a,this.Ie=null}}function e3(e,t=null,r=[],i=[],n=null,s=null,a=null){return new e4(e,t,r,i,n,s,a)}function e6(e){if(null===e.Ie){let t=e.path.canonicalString();null!==e.collectionGroup&&(t+="|cg:"+e.collectionGroup),t+="|f:"+e.filters.map(e=>(function e(t){if(t instanceof ej)return t.field.canonicalString()+t.op.toString()+eb(t.value);if(eY(t)&&eX(t))return t.filters.map(t=>e(t)).join(",");{let r=t.filters.map(t=>e(t)).join(",");return`${t.op}(${r})`}})(e)).join(",")+"|ob:"+e.orderBy.map(e=>e.field.canonicalString()+e.dir).join(","),null==e.limit||(t+="|l:"+e.limit),e.startAt&&(t+="|lb:"+(e.startAt.inclusive?"b:":"a:")+e.startAt.position.map(e=>eb(e)).join(",")),e.endAt&&(t+="|ub:"+(e.endAt.inclusive?"a:":"b:")+e.endAt.position.map(e=>eb(e)).join(",")),e.Ie=t}return e.Ie}function e7(e,t){if(e.limit!==t.limit||e.orderBy.length!==t.orderBy.length)return!1;for(let n=0;n<e.orderBy.length;n++){var r,i;if(r=e.orderBy[n],i=t.orderBy[n],!(r.dir===i.dir&&r.field.isEqual(i.field)))return!1}if(e.filters.length!==t.filters.length)return!1;for(let r=0;r<e.filters.length;r++)if(!function e(t,r){return t instanceof ej?r instanceof ej&&t.op===r.op&&t.field.isEqual(r.field)&&ek(t.value,r.value):t instanceof eH?r instanceof eH&&t.op===r.op&&t.filters.length===r.filters.length&&t.filters.reduce((t,i,n)=>t&&e(i,r.filters[n]),!0):void I(19439)}(e.filters[r],t.filters[r]))return!1;return e.collectionGroup===t.collectionGroup&&!!e.path.isEqual(t.path)&&!!eQ(e.startAt,t.startAt)&&eQ(e.endAt,t.endAt)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class e8{constructor(e,t=null,r=[],i=[],n=null,s="F",a=null,o=null){this.path=e,this.collectionGroup=t,this.explicitOrderBy=r,this.filters=i,this.limit=n,this.limitType=s,this.startAt=a,this.endAt=o,this.Ee=null,this.de=null,this.Ae=null,this.startAt,this.endAt}}function te(e){return 0===e.filters.length&&null===e.limit&&null==e.startAt&&null==e.endAt&&(0===e.explicitOrderBy.length||1===e.explicitOrderBy.length&&e.explicitOrderBy[0].field.isKeyField())}function tt(e){if(null===e.Ee){let t;e.Ee=[];let r=new Set;for(let t of e.explicitOrderBy)e.Ee.push(t),r.add(t.field.canonicalString());let i=e.explicitOrderBy.length>0?e.explicitOrderBy[e.explicitOrderBy.length-1].dir:"asc";(t=new eo(j.comparator),e.filters.forEach(e=>{e.getFlattenedFilters().forEach(e=>{e.isInequality()&&(t=t.add(e.field))})}),t).forEach(t=>{r.has(t.canonicalString())||t.isKeyField()||e.Ee.push(new ez(t,i))}),r.has(j.keyField().canonicalString())||e.Ee.push(new ez(j.keyField(),i))}return e.Ee}function tr(e){return e.de||(e.de=function(e,t){if("F"===e.limitType)return e3(e.path,e.collectionGroup,t,e.filters,e.limit,e.startAt,e.endAt);{t=t.map(e=>{let t="desc"===e.dir?"asc":"desc";return new ez(e.field,t)});let r=e.endAt?new eq(e.endAt.position,e.endAt.inclusive):null,i=e.startAt?new eq(e.startAt.position,e.startAt.inclusive):null;return e3(e.path,e.collectionGroup,t,e.filters,e.limit,r,i)}}(e,tt(e))),e.de}function ti(e,t,r){return new e8(e.path,e.collectionGroup,e.explicitOrderBy.slice(),e.filters.slice(),t,r,e.startAt,e.endAt)}function tn(e,t){return e7(tr(e),tr(t))&&e.limitType===t.limitType}function ts(e){return`${e6(tr(e))}|lt:${e.limitType}`}function ta(e){var t;let r;return`Query(target=${r=(t=tr(e)).path.canonicalString(),null!==t.collectionGroup&&(r+=" collectionGroup="+t.collectionGroup),t.filters.length>0&&(r+=`, filters: [${t.filters.map(e=>(function e(t){return t instanceof ej?`${t.field.canonicalString()} ${t.op} ${eb(t.value)}`:t instanceof eH?t.op.toString()+" {"+t.getFilters().map(e).join(" ,")+"}":"Filter"})(e)).join(", ")}]`),null==t.limit||(r+=", limit: "+t.limit),t.orderBy.length>0&&(r+=`, orderBy: [${t.orderBy.map(e=>`${e.field.canonicalString()} (${e.dir})`).join(", ")}]`),t.startAt&&(r+=", startAt: "+(t.startAt.inclusive?"b:":"a:")+t.startAt.position.map(e=>eb(e)).join(",")),t.endAt&&(r+=", endAt: "+(t.endAt.inclusive?"a:":"b:")+t.endAt.position.map(e=>eb(e)).join(",")),`Target(${r})`}; limitType=${e.limitType})`}function to(e,t){return t.isFoundDocument()&&function(e,t){let r=t.key.path;return null!==e.collectionGroup?t.key.hasCollectionId(e.collectionGroup)&&e.path.isPrefixOf(r):H.isDocumentKey(e.path)?e.path.isEqual(r):e.path.isImmediateParentOf(r)}(e,t)&&function(e,t){for(let r of tt(e))if(!r.field.isKeyField()&&null===t.data.field(r.field))return!1;return!0}(e,t)&&function(e,t){for(let r of e.filters)if(!r.matches(t))return!1;return!0}(e,t)&&(!e.startAt||!!function(e,t,r){let i=eK(e,t,r);return e.inclusive?i<=0:i<0}(e.startAt,tt(e),t))&&(!e.endAt||!!function(e,t,r){let i=eK(e,t,r);return e.inclusive?i>=0:i>0}(e.endAt,tt(e),t))}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class tl{constructor(e,t){this.mapKeyFn=e,this.equalsFn=t,this.inner={},this.innerSize=0}get(e){let t=this.mapKeyFn(e),r=this.inner[t];if(void 0!==r){for(let[t,i]of r)if(this.equalsFn(t,e))return i}}has(e){return void 0!==this.get(e)}set(e,t){let r=this.mapKeyFn(e),i=this.inner[r];if(void 0===i)return this.inner[r]=[[e,t]],void this.innerSize++;for(let r=0;r<i.length;r++)if(this.equalsFn(i[r][0],e))return void(i[r]=[e,t]);i.push([e,t]),this.innerSize++}delete(e){let t=this.mapKeyFn(e),r=this.inner[t];if(void 0===r)return!1;for(let i=0;i<r.length;i++)if(this.equalsFn(r[i][0],e))return 1===r.length?delete this.inner[t]:r.splice(i,1),this.innerSize--,!0;return!1}forEach(e){ei(this.inner,(t,r)=>{for(let[t,i]of r)e(t,i)})}isEmpty(){return function(e){for(let t in e)if(Object.prototype.hasOwnProperty.call(e,t))return!1;return!0}(this.inner)}size(){return this.innerSize}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let tu=new en(H.comparator),th=new en(H.comparator);function tc(...e){let t=th;for(let r of e)t=t.insert(r.key,r);return t}function td(){return new tl(e=>e.toString(),(e,t)=>e.isEqual(t))}new en(H.comparator);let tm=new eo(H.comparator);function tf(...e){let t=tm;for(let r of e)t=t.add(r);return t}let tg=new eo(F);/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class tp{constructor(){this._=void 0}}class ty extends tp{}class tv extends tp{constructor(e){super(),this.elements=e}}function tE(e,t){let r=tN(t);for(let t of e.elements)r.some(e=>ek(e,t))||r.push(t);return{arrayValue:{values:r}}}class tw extends tp{constructor(e){super(),this.elements=e}}function tT(e,t){let r=tN(t);for(let t of e.elements)r=r.filter(e=>!ek(e,t));return{arrayValue:{values:r}}}class tA extends tp{constructor(e,t){super(),this.serializer=e,this.Re=t}}function tI(e){return ef(e.integerValue||e.doubleValue)}function tN(e){return eL(e)&&e.arrayValue.values?e.arrayValue.values.slice():[]}class t_{constructor(e,t){this.updateTime=e,this.exists=t}static none(){return new t_}static exists(e){return new t_(void 0,e)}static updateTime(e){return new t_(e)}get isNone(){return void 0===this.updateTime&&void 0===this.exists}isEqual(e){return this.exists===e.exists&&(this.updateTime?!!e.updateTime&&this.updateTime.isEqual(e.updateTime):!e.updateTime)}}function tS(e,t){return void 0!==e.updateTime?t.isFoundDocument()&&t.version.isEqual(e.updateTime):void 0===e.exists||e.exists===t.isFoundDocument()}class tC{}function tk(e,t){if(!e.hasLocalMutations||t&&0===t.fields.length)return null;if(null===t)return e.isNoDocument()?new tM(e.key,t_.none()):new tR(e.key,e.data,t_.none());{let r=e.data,i=eB.empty(),n=new eo(j.comparator);for(let e of t.fields)if(!n.has(e)){let t=r.field(e);null===t&&e.length>1&&(e=e.popLast(),t=r.field(e)),null===t?i.delete(e):i.set(e,t),n=n.add(e)}return new tV(e.key,i,new eu(n.toArray()),t_.none())}}function tD(e,t,r,i){return e instanceof tR?function(e,t,r,i){if(!tS(e.precondition,t))return r;let n=e.value.clone(),s=tL(e.fieldTransforms,i,t);return n.setAll(s),t.convertToFoundDocument(t.version,n).setHasLocalMutations(),null}(e,t,r,i):e instanceof tV?function(e,t,r,i){if(!tS(e.precondition,t))return r;let n=tL(e.fieldTransforms,i,t),s=t.data;return(s.setAll(tb(e)),s.setAll(n),t.convertToFoundDocument(t.version,s).setHasLocalMutations(),null===r)?null:r.unionWith(e.fieldMask.fields).unionWith(e.fieldTransforms.map(e=>e.field))}(e,t,r,i):tS(e.precondition,t)?(t.convertToNoDocument(t.version).setHasLocalMutations(),null):r}function tx(e,t){var r,i;return e.type===t.type&&!!e.key.isEqual(t.key)&&!!e.precondition.isEqual(t.precondition)&&(r=e.fieldTransforms,i=t.fieldTransforms,!!(void 0===r&&void 0===i||!(!r||!i)&&B(r,i,(e,t)=>{var r,i;return e.field.isEqual(t.field)&&(r=e.transform,i=t.transform,r instanceof tv&&i instanceof tv||r instanceof tw&&i instanceof tw?B(r.elements,i.elements,ek):r instanceof tA&&i instanceof tA?ek(r.Re,i.Re):r instanceof ty&&i instanceof ty)})))&&(0===e.type?e.value.isEqual(t.value):1!==e.type||e.data.isEqual(t.data)&&e.fieldMask.isEqual(t.fieldMask))}class tR extends tC{constructor(e,t,r,i=[]){super(),this.key=e,this.value=t,this.precondition=r,this.fieldTransforms=i,this.type=0}getFieldMask(){return null}}class tV extends tC{constructor(e,t,r,i,n=[]){super(),this.key=e,this.data=t,this.fieldMask=r,this.precondition=i,this.fieldTransforms=n,this.type=1}getFieldMask(){return this.fieldMask}}function tb(e){let t=new Map;return e.fieldMask.fields.forEach(r=>{if(!r.isEmpty()){let i=e.data.field(r);t.set(r,i)}}),t}function tO(e,t,r){let i=new Map;_(e.length===r.length,32656,{Ve:r.length,me:e.length});for(let s=0;s<r.length;s++){var n;let a=e[s],o=a.transform,l=t.data.field(a.field);i.set(a.field,(n=r[s],o instanceof tv?tE(o,l):o instanceof tw?tT(o,l):n))}return i}function tL(e,t,r){let i=new Map;for(let n of e){let e=n.transform,s=r.data.field(n.field);i.set(n.field,e instanceof ty?function(e,t){let r={fields:{[ey]:{stringValue:ep},[eE]:{timestampValue:{seconds:e.seconds,nanos:e.nanoseconds}}}};return t&&ew(t)&&(t=function e(t){let r=t.mapValue.fields[ev];return ew(r)?e(r):r}(t)),t&&(r.fields[ev]=t),{mapValue:r}}(t,s):e instanceof tv?tE(e,s):e instanceof tw?tT(e,s):function(e,t){var r,i;let n=(r=e,i=t,r instanceof tA?eO(i)||i&&"doubleValue"in i?i:{integerValue:0}:null),s=tI(n)+tI(e.Re);return eO(n)&&eO(e.Re)?{integerValue:""+s}:/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function(e,t){if(e.useProto3Json){if(isNaN(t))return{doubleValue:"NaN"};if(t===1/0)return{doubleValue:"Infinity"};if(t===-1/0)return{doubleValue:"-Infinity"}}return{doubleValue:et(t)?"-0":t}}(e.serializer,s)}(e,s))}return i}class tM extends tC{constructor(e,t){super(),this.key=e,this.precondition=t,this.type=2,this.fieldTransforms=[]}getFieldMask(){return null}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class tF{constructor(e,t,r,i){this.batchId=e,this.localWriteTime=t,this.baseMutations=r,this.mutations=i}applyToRemoteDocument(e,t){let r=t.mutationResults;for(let t=0;t<this.mutations.length;t++){let n=this.mutations[t];if(n.key.isEqual(e.key)){var i;i=r[t],n instanceof tR?function(e,t,r){let i=e.value.clone(),n=tO(e.fieldTransforms,t,r.transformResults);i.setAll(n),t.convertToFoundDocument(r.version,i).setHasCommittedMutations()}(n,e,i):n instanceof tV?function(e,t,r){if(!tS(e.precondition,t))return void t.convertToUnknownDocument(r.version);let i=tO(e.fieldTransforms,t,r.transformResults),n=t.data;n.setAll(tb(e)),n.setAll(i),t.convertToFoundDocument(r.version,n).setHasCommittedMutations()}(n,e,i):function(e,t,r){t.convertToNoDocument(r.version).setHasCommittedMutations()}(0,e,i)}}}applyToLocalView(e,t){for(let r of this.baseMutations)r.key.isEqual(e.key)&&(t=tD(r,e,t,this.localWriteTime));for(let r of this.mutations)r.key.isEqual(e.key)&&(t=tD(r,e,t,this.localWriteTime));return t}applyToLocalDocumentSet(e,t){let r=td();return this.mutations.forEach(i=>{let n=e.get(i.key),s=n.overlayedDocument,a=this.applyToLocalView(s,n.mutatedFields),o=tk(s,a=t.has(i.key)?null:a);null!==o&&r.set(i.key,o),s.isValidDocument()||s.convertToNoDocument(q.min())}),r}keys(){return this.mutations.reduce((e,t)=>e.add(t.key),tf())}isEqual(e){return this.batchId===e.batchId&&B(this.mutations,e.mutations,(e,t)=>tx(e,t))&&B(this.baseMutations,e.baseMutations,(e,t)=>tx(e,t))}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class tP{constructor(e,t){this.largestBatchId=e,this.mutation=t}getKey(){return this.mutation.key}isEqual(e){return null!==e&&this.mutation===e.mutation}toString(){return`Overlay{
      largestBatchId: ${this.largestBatchId},
      mutation: ${this.mutation.toString()}
    }`}}(n=i||(i={}))[n.OK=0]="OK",n[n.CANCELLED=1]="CANCELLED",n[n.UNKNOWN=2]="UNKNOWN",n[n.INVALID_ARGUMENT=3]="INVALID_ARGUMENT",n[n.DEADLINE_EXCEEDED=4]="DEADLINE_EXCEEDED",n[n.NOT_FOUND=5]="NOT_FOUND",n[n.ALREADY_EXISTS=6]="ALREADY_EXISTS",n[n.PERMISSION_DENIED=7]="PERMISSION_DENIED",n[n.UNAUTHENTICATED=16]="UNAUTHENTICATED",n[n.RESOURCE_EXHAUSTED=8]="RESOURCE_EXHAUSTED",n[n.FAILED_PRECONDITION=9]="FAILED_PRECONDITION",n[n.ABORTED=10]="ABORTED",n[n.OUT_OF_RANGE=11]="OUT_OF_RANGE",n[n.UNIMPLEMENTED=12]="UNIMPLEMENTED",n[n.INTERNAL=13]="INTERNAL",n[n.UNAVAILABLE=14]="UNAVAILABLE",n[n.DATA_LOSS=15]="DATA_LOSS",new c.z8([4294967295,4294967295],0);class tU{constructor(e,t){this.databaseId=e,this.useProto3Json=t}}function tB(e){return _(!!e,49232),q.fromTimestamp(function(e){let t=em(e);return new $(t.seconds,t.nanos)}(e))}function t$(e,t){let r=new z(["projects",e.projectId,"databases",e.database]).child("documents");return void 0===t?r:r.child(t)}function tq(e){return j.fromServerFormat(e.fieldPath)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class tK{constructor(e){this.wt=e}}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class tQ{constructor(){}vt(e,t){this.Ct(e,t),t.Ft()}Ct(e,t){if("nullValue"in e)this.Mt(t,5);else if("booleanValue"in e)this.Mt(t,10),t.xt(e.booleanValue?1:0);else if("integerValue"in e)this.Mt(t,15),t.xt(ef(e.integerValue));else if("doubleValue"in e){let r=ef(e.doubleValue);isNaN(r)?this.Mt(t,13):(this.Mt(t,15),et(r)?t.xt(0):t.xt(r))}else if("timestampValue"in e){let r=e.timestampValue;this.Mt(t,20),"string"==typeof r&&(r=em(r)),t.Ot(`${r.seconds||""}`),t.xt(r.nanos||0)}else if("stringValue"in e)this.Nt(e.stringValue,t),this.Bt(t);else if("bytesValue"in e)this.Mt(t,30),t.Lt(eg(e.bytesValue)),this.Bt(t);else if("referenceValue"in e)this.kt(e.referenceValue,t);else if("geoPointValue"in e){let r=e.geoPointValue;this.Mt(t,45),t.xt(r.latitude||0),t.xt(r.longitude||0)}else"mapValue"in e?eU(e)?this.Mt(t,Number.MAX_SAFE_INTEGER):eF(e)?this.qt(e.mapValue,t):(this.Qt(e.mapValue,t),this.Bt(t)):"arrayValue"in e?(this.$t(e.arrayValue,t),this.Bt(t)):I(19022,{Ut:e})}Nt(e,t){this.Mt(t,25),this.Kt(e,t)}Kt(e,t){t.Ot(e)}Qt(e,t){let r=e.fields||{};for(let e of(this.Mt(t,55),Object.keys(r)))this.Nt(e,t),this.Ct(r[e],t)}qt(e,t){var r,i;let n=e.fields||{};this.Mt(t,53);let s=(null===(i=null===(r=n[eS].arrayValue)||void 0===r?void 0:r.values)||void 0===i?void 0:i.length)||0;this.Mt(t,15),t.xt(ef(s)),this.Nt(eS,t),this.Ct(n[eS],t)}$t(e,t){let r=e.values||[];for(let e of(this.Mt(t,50),r))this.Ct(e,t)}kt(e,t){this.Mt(t,37),H.fromName(e).path.forEach(e=>{this.Mt(t,60),this.Kt(e,t)})}Mt(e,t){e.xt(t)}Bt(e){e.xt(2)}}tQ.Wt=new tQ;/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class tz{constructor(){this.Cn=new tG}addToCollectionParentIndex(e,t){return this.Cn.add(t),J.resolve()}getCollectionParents(e,t){return J.resolve(this.Cn.getEntries(t))}addFieldIndex(e,t){return J.resolve()}deleteFieldIndex(e,t){return J.resolve()}deleteAllFieldIndexes(e){return J.resolve()}createTargetIndexes(e,t){return J.resolve()}getDocumentsMatchingTarget(e,t){return J.resolve(null)}getIndexType(e,t){return J.resolve(0)}getFieldIndexes(e,t){return J.resolve([])}getNextCollectionGroupToUpdate(e){return J.resolve(null)}getMinOffset(e,t){return J.resolve(Y.min())}getMinOffsetFromCollectionGroup(e,t){return J.resolve(Y.min())}updateCollectionGroup(e,t,r){return J.resolve()}updateIndexEntries(e,t){return J.resolve()}}class tG{constructor(){this.index={}}add(e){let t=e.lastSegment(),r=e.popLast(),i=this.index[t]||new eo(z.comparator),n=!i.has(r);return this.index[t]=i.add(r),n}has(e){let t=e.lastSegment(),r=e.popLast(),i=this.index[t];return i&&i.has(r)}getEntries(e){return(this.index[e]||new eo(z.comparator)).toArray()}}new Uint8Array(0);class tj{static withCacheSize(e){return new tj(e,tj.DEFAULT_COLLECTION_PERCENTILE,tj.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT)}constructor(e,t,r){this.cacheSizeCollectionThreshold=e,this.percentileToCollect=t,this.maximumSequenceNumbersToCollect=r}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */tj.DEFAULT_COLLECTION_PERCENTILE=10,tj.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT=1e3,tj.DEFAULT=new tj(41943040,tj.DEFAULT_COLLECTION_PERCENTILE,tj.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT),tj.DISABLED=new tj(-1,0,0);/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class tH{constructor(e){this.ur=e}next(){return this.ur+=2,this.ur}static cr(){return new tH(0)}static lr(){return new tH(-1)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class tX{constructor(){this.changes=new tl(e=>e.toString(),(e,t)=>e.isEqual(t)),this.changesApplied=!1}addEntry(e){this.assertNotApplied(),this.changes.set(e.key,e)}removeEntry(e,t){this.assertNotApplied(),this.changes.set(e,e$.newInvalidDocument(e).setReadTime(t))}getEntry(e,t){this.assertNotApplied();let r=this.changes.get(t);return void 0!==r?J.resolve(r):this.getFromCache(e,t)}getEntries(e,t){return this.getAllFromCache(e,t)}apply(e){return this.assertNotApplied(),this.changesApplied=!0,this.applyChanges(e)}assertNotApplied(){}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class tY{constructor(e,t){this.overlayedDocument=e,this.mutatedFields=t}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class tW{constructor(e,t,r,i){this.remoteDocumentCache=e,this.mutationQueue=t,this.documentOverlayCache=r,this.indexManager=i}getDocument(e,t){let r=null;return this.documentOverlayCache.getOverlay(e,t).next(i=>(r=i,this.remoteDocumentCache.getEntry(e,t))).next(e=>(null!==r&&tD(r.mutation,e,eu.empty(),$.now()),e))}getDocuments(e,t){return this.remoteDocumentCache.getEntries(e,t).next(t=>this.getLocalViewOfDocuments(e,t,tf()).next(()=>t))}getLocalViewOfDocuments(e,t,r=tf()){let i=td();return this.populateOverlays(e,i,t).next(()=>this.computeViews(e,t,i,r).next(e=>{let t=tc();return e.forEach((e,r)=>{t=t.insert(e,r.overlayedDocument)}),t}))}getOverlayedDocuments(e,t){let r=td();return this.populateOverlays(e,r,t).next(()=>this.computeViews(e,t,r,tf()))}populateOverlays(e,t,r){let i=[];return r.forEach(e=>{t.has(e)||i.push(e)}),this.documentOverlayCache.getOverlays(e,i).next(e=>{e.forEach((e,r)=>{t.set(e,r)})})}computeViews(e,t,r,i){let n=tu,s=td(),a=td();return t.forEach((e,t)=>{let a=r.get(t.key);i.has(t.key)&&(void 0===a||a.mutation instanceof tV)?n=n.insert(t.key,t):void 0!==a?(s.set(t.key,a.mutation.getFieldMask()),tD(a.mutation,t,a.mutation.getFieldMask(),$.now())):s.set(t.key,eu.empty())}),this.recalculateAndSaveOverlays(e,n).next(e=>(e.forEach((e,t)=>s.set(e,t)),t.forEach((e,t)=>{var r;return a.set(e,new tY(t,null!==(r=s.get(e))&&void 0!==r?r:null))}),a))}recalculateAndSaveOverlays(e,t){let r=td(),i=new en((e,t)=>e-t),n=tf();return this.mutationQueue.getAllMutationBatchesAffectingDocumentKeys(e,t).next(e=>{for(let n of e)n.keys().forEach(e=>{let s=t.get(e);if(null===s)return;let a=r.get(e)||eu.empty();a=n.applyToLocalView(s,a),r.set(e,a);let o=(i.get(n.batchId)||tf()).add(e);i=i.insert(n.batchId,o)})}).next(()=>{let s=[],a=i.getReverseIterator();for(;a.hasNext();){let i=a.getNext(),o=i.key,l=i.value,u=td();l.forEach(e=>{if(!n.has(e)){let i=tk(t.get(e),r.get(e));null!==i&&u.set(e,i),n=n.add(e)}}),s.push(this.documentOverlayCache.saveOverlays(e,o,u))}return J.waitFor(s)}).next(()=>r)}recalculateAndSaveOverlaysForDocumentKeys(e,t){return this.remoteDocumentCache.getEntries(e,t).next(t=>this.recalculateAndSaveOverlays(e,t))}getDocumentsMatchingQuery(e,t,r,i){return H.isDocumentKey(t.path)&&null===t.collectionGroup&&0===t.filters.length?this.getDocumentsMatchingDocumentQuery(e,t.path):null!==t.collectionGroup?this.getDocumentsMatchingCollectionGroupQuery(e,t,r,i):this.getDocumentsMatchingCollectionQuery(e,t,r,i)}getNextDocuments(e,t,r,i){return this.remoteDocumentCache.getAllFromCollectionGroup(e,t,r,i).next(n=>{let s=i-n.size>0?this.documentOverlayCache.getOverlaysForCollectionGroup(e,t,r.largestBatchId,i-n.size):J.resolve(td()),a=-1,o=n;return s.next(t=>J.forEach(t,(t,r)=>(a<r.largestBatchId&&(a=r.largestBatchId),n.get(t)?J.resolve():this.remoteDocumentCache.getEntry(e,t).next(e=>{o=o.insert(t,e)}))).next(()=>this.populateOverlays(e,t,n)).next(()=>this.computeViews(e,o,t,tf())).next(e=>{let t;return{batchId:a,changes:(t=th,e.forEach((e,r)=>t=t.insert(e,r.overlayedDocument)),t)}}))})}getDocumentsMatchingDocumentQuery(e,t){return this.getDocument(e,new H(t)).next(e=>{let t=tc();return e.isFoundDocument()&&(t=t.insert(e.key,e)),t})}getDocumentsMatchingCollectionGroupQuery(e,t,r,i){let n=t.collectionGroup,s=tc();return this.indexManager.getCollectionParents(e,n).next(a=>J.forEach(a,a=>{let o=new e8(a.child(n),null,t.explicitOrderBy.slice(),t.filters.slice(),t.limit,t.limitType,t.startAt,t.endAt);return this.getDocumentsMatchingCollectionQuery(e,o,r,i).next(e=>{e.forEach((e,t)=>{s=s.insert(e,t)})})}).next(()=>s))}getDocumentsMatchingCollectionQuery(e,t,r,i){let n;return this.documentOverlayCache.getOverlaysForCollection(e,t.path,r.largestBatchId).next(s=>(n=s,this.remoteDocumentCache.getDocumentsMatchingQuery(e,t,r,n,i))).next(e=>{n.forEach((t,r)=>{let i=r.getKey();null===e.get(i)&&(e=e.insert(i,e$.newInvalidDocument(i)))});let r=tc();return e.forEach((e,i)=>{let s=n.get(e);void 0!==s&&tD(s.mutation,i,eu.empty(),$.now()),to(t,i)&&(r=r.insert(e,i))}),r})}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class tJ{constructor(e){this.serializer=e,this.kr=new Map,this.qr=new Map}getBundleMetadata(e,t){return J.resolve(this.kr.get(t))}saveBundleMetadata(e,t){return this.kr.set(t.id,{id:t.id,version:t.version,createTime:tB(t.createTime)}),J.resolve()}getNamedQuery(e,t){return J.resolve(this.qr.get(t))}saveNamedQuery(e,t){return this.qr.set(t.name,{name:t.name,query:function(e){let t=function(e){var t;let r,i=function(e){let t=function(e){let t=z.fromString(e);return _(t.length>=4&&"projects"===t.get(0)&&"databases"===t.get(2),10190,{key:t.toString()}),t}(e);return 4===t.length?z.emptyPath():(_(t.length>4&&"documents"===t.get(4),29091,{key:t.toString()}),t.popFirst(5))}(e.parent),n=e.structuredQuery,s=n.from?n.from.length:0,a=null;if(s>0){_(1===s,65062);let e=n.from[0];e.allDescendants?a=e.collectionId:i=i.child(e.collectionId)}let o=[];n.where&&(o=function(e){var t;let r=function e(t){return void 0!==t.unaryFilter?function(e){switch(e.unaryFilter.op){case"IS_NAN":let t=tq(e.unaryFilter.field);return ej.create(t,"==",{doubleValue:NaN});case"IS_NULL":let r=tq(e.unaryFilter.field);return ej.create(r,"==",{nullValue:"NULL_VALUE"});case"IS_NOT_NAN":let i=tq(e.unaryFilter.field);return ej.create(i,"!=",{doubleValue:NaN});case"IS_NOT_NULL":let n=tq(e.unaryFilter.field);return ej.create(n,"!=",{nullValue:"NULL_VALUE"});case"OPERATOR_UNSPECIFIED":return I(61313);default:return I(60726)}}(t):void 0!==t.fieldFilter?ej.create(tq(t.fieldFilter.field),function(e){switch(e){case"EQUAL":return"==";case"NOT_EQUAL":return"!=";case"GREATER_THAN":return">";case"GREATER_THAN_OR_EQUAL":return">=";case"LESS_THAN":return"<";case"LESS_THAN_OR_EQUAL":return"<=";case"ARRAY_CONTAINS":return"array-contains";case"IN":return"in";case"NOT_IN":return"not-in";case"ARRAY_CONTAINS_ANY":return"array-contains-any";case"OPERATOR_UNSPECIFIED":return I(58110);default:return I(50506)}}(t.fieldFilter.op),t.fieldFilter.value):void 0!==t.compositeFilter?eH.create(t.compositeFilter.filters.map(t=>e(t)),function(e){switch(e){case"AND":return"and";case"OR":return"or";default:return I(1026)}}(t.compositeFilter.op)):I(30097,{filter:t})}(e);return r instanceof eH&&eY(t=r)&&eX(t)?r.getFilters():[r]}(n.where));let l=[];n.orderBy&&(l=n.orderBy.map(e=>new ez(tq(e.field),function(e){switch(e){case"ASCENDING":return"asc";case"DESCENDING":return"desc";default:return}}(e.direction))));let u=null;n.limit&&(u=null==(r="object"==typeof(t=n.limit)?t.value:t)?null:r);let h=null;n.startAt&&(h=function(e){let t=!!e.before;return new eq(e.values||[],t)}(n.startAt));let c=null;return n.endAt&&(c=function(e){let t=!e.before;return new eq(e.values||[],t)}(n.endAt)),new e8(i,a,l,o,u,"F",h,c)}({parent:e.parent,structuredQuery:e.structuredQuery});return"LAST"===e.limitType?ti(t,t.limit,"L"):t}(t.bundledQuery),readTime:tB(t.readTime)}),J.resolve()}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class tZ{constructor(){this.overlays=new en(H.comparator),this.Qr=new Map}getOverlay(e,t){return J.resolve(this.overlays.get(t))}getOverlays(e,t){let r=td();return J.forEach(t,t=>this.getOverlay(e,t).next(e=>{null!==e&&r.set(t,e)})).next(()=>r)}saveOverlays(e,t,r){return r.forEach((r,i)=>{this.St(e,t,i)}),J.resolve()}removeOverlaysForBatchId(e,t,r){let i=this.Qr.get(r);return void 0!==i&&(i.forEach(e=>this.overlays=this.overlays.remove(e)),this.Qr.delete(r)),J.resolve()}getOverlaysForCollection(e,t,r){let i=td(),n=t.length+1,s=new H(t.child("")),a=this.overlays.getIteratorFrom(s);for(;a.hasNext();){let e=a.getNext().value,s=e.getKey();if(!t.isPrefixOf(s.path))break;s.path.length===n&&e.largestBatchId>r&&i.set(e.getKey(),e)}return J.resolve(i)}getOverlaysForCollectionGroup(e,t,r,i){let n=new en((e,t)=>e-t),s=this.overlays.getIterator();for(;s.hasNext();){let e=s.getNext().value;if(e.getKey().getCollectionGroup()===t&&e.largestBatchId>r){let t=n.get(e.largestBatchId);null===t&&(t=td(),n=n.insert(e.largestBatchId,t)),t.set(e.getKey(),e)}}let a=td(),o=n.getIterator();for(;o.hasNext()&&(o.getNext().value.forEach((e,t)=>a.set(e,t)),!(a.size()>=i)););return J.resolve(a)}St(e,t,r){let i=this.overlays.get(r.key);if(null!==i){let e=this.Qr.get(i.largestBatchId).delete(r.key);this.Qr.set(i.largestBatchId,e)}this.overlays=this.overlays.insert(r.key,new tP(t,r));let n=this.Qr.get(t);void 0===n&&(n=tf(),this.Qr.set(t,n)),this.Qr.set(t,n.add(r.key))}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class t0{constructor(){this.sessionToken=ec.EMPTY_BYTE_STRING}getSessionToken(e){return J.resolve(this.sessionToken)}setSessionToken(e,t){return this.sessionToken=t,J.resolve()}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class t1{constructor(){this.$r=new eo(t2.Ur),this.Kr=new eo(t2.Wr)}isEmpty(){return this.$r.isEmpty()}addReference(e,t){let r=new t2(e,t);this.$r=this.$r.add(r),this.Kr=this.Kr.add(r)}Gr(e,t){e.forEach(e=>this.addReference(e,t))}removeReference(e,t){this.zr(new t2(e,t))}jr(e,t){e.forEach(e=>this.removeReference(e,t))}Hr(e){let t=new H(new z([])),r=new t2(t,e),i=new t2(t,e+1),n=[];return this.Kr.forEachInRange([r,i],e=>{this.zr(e),n.push(e.key)}),n}Jr(){this.$r.forEach(e=>this.zr(e))}zr(e){this.$r=this.$r.delete(e),this.Kr=this.Kr.delete(e)}Yr(e){let t=new H(new z([])),r=new t2(t,e),i=new t2(t,e+1),n=tf();return this.Kr.forEachInRange([r,i],e=>{n=n.add(e.key)}),n}containsKey(e){let t=new t2(e,0),r=this.$r.firstAfterOrEqual(t);return null!==r&&e.isEqual(r.key)}}class t2{constructor(e,t){this.key=e,this.Zr=t}static Ur(e,t){return H.comparator(e.key,t.key)||F(e.Zr,t.Zr)}static Wr(e,t){return F(e.Zr,t.Zr)||H.comparator(e.key,t.key)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class t5{constructor(e,t){this.indexManager=e,this.referenceDelegate=t,this.mutationQueue=[],this.nr=1,this.Xr=new eo(t2.Ur)}checkEmpty(e){return J.resolve(0===this.mutationQueue.length)}addMutationBatch(e,t,r,i){let n=this.nr;this.nr++,this.mutationQueue.length>0&&this.mutationQueue[this.mutationQueue.length-1];let s=new tF(n,t,r,i);for(let t of(this.mutationQueue.push(s),i))this.Xr=this.Xr.add(new t2(t.key,n)),this.indexManager.addToCollectionParentIndex(e,t.key.path.popLast());return J.resolve(s)}lookupMutationBatch(e,t){return J.resolve(this.ei(t))}getNextMutationBatchAfterBatchId(e,t){let r=this.ti(t+1),i=r<0?0:r;return J.resolve(this.mutationQueue.length>i?this.mutationQueue[i]:null)}getHighestUnacknowledgedBatchId(){return J.resolve(0===this.mutationQueue.length?-1:this.nr-1)}getAllMutationBatches(e){return J.resolve(this.mutationQueue.slice())}getAllMutationBatchesAffectingDocumentKey(e,t){let r=new t2(t,0),i=new t2(t,Number.POSITIVE_INFINITY),n=[];return this.Xr.forEachInRange([r,i],e=>{let t=this.ei(e.Zr);n.push(t)}),J.resolve(n)}getAllMutationBatchesAffectingDocumentKeys(e,t){let r=new eo(F);return t.forEach(e=>{let t=new t2(e,0),i=new t2(e,Number.POSITIVE_INFINITY);this.Xr.forEachInRange([t,i],e=>{r=r.add(e.Zr)})}),J.resolve(this.ni(r))}getAllMutationBatchesAffectingQuery(e,t){let r=t.path,i=r.length+1,n=r;H.isDocumentKey(n)||(n=n.child(""));let s=new t2(new H(n),0),a=new eo(F);return this.Xr.forEachWhile(e=>{let t=e.key.path;return!!r.isPrefixOf(t)&&(t.length===i&&(a=a.add(e.Zr)),!0)},s),J.resolve(this.ni(a))}ni(e){let t=[];return e.forEach(e=>{let r=this.ei(e);null!==r&&t.push(r)}),t}removeMutationBatch(e,t){_(0===this.ri(t.batchId,"removed"),55003),this.mutationQueue.shift();let r=this.Xr;return J.forEach(t.mutations,i=>{let n=new t2(i.key,t.batchId);return r=r.delete(n),this.referenceDelegate.markPotentiallyOrphaned(e,i.key)}).next(()=>{this.Xr=r})}sr(e){}containsKey(e,t){let r=new t2(t,0),i=this.Xr.firstAfterOrEqual(r);return J.resolve(t.isEqual(i&&i.key))}performConsistencyCheck(e){return this.mutationQueue.length,J.resolve()}ri(e,t){return this.ti(e)}ti(e){return 0===this.mutationQueue.length?0:e-this.mutationQueue[0].batchId}ei(e){let t=this.ti(e);return t<0||t>=this.mutationQueue.length?null:this.mutationQueue[t]}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class t9{constructor(e){this.ii=e,this.docs=new en(H.comparator),this.size=0}setIndexManager(e){this.indexManager=e}addEntry(e,t){let r=t.key,i=this.docs.get(r),n=i?i.size:0,s=this.ii(t);return this.docs=this.docs.insert(r,{document:t.mutableCopy(),size:s}),this.size+=s-n,this.indexManager.addToCollectionParentIndex(e,r.path.popLast())}removeEntry(e){let t=this.docs.get(e);t&&(this.docs=this.docs.remove(e),this.size-=t.size)}getEntry(e,t){let r=this.docs.get(t);return J.resolve(r?r.document.mutableCopy():e$.newInvalidDocument(t))}getEntries(e,t){let r=tu;return t.forEach(e=>{let t=this.docs.get(e);r=r.insert(e,t?t.document.mutableCopy():e$.newInvalidDocument(e))}),J.resolve(r)}getDocumentsMatchingQuery(e,t,r,i){let n=tu,s=t.path,a=new H(s.child("__id-9223372036854775808__")),o=this.docs.getIteratorFrom(a);for(;o.hasNext();){let{key:e,value:{document:a}}=o.getNext();if(!s.isPrefixOf(e.path))break;e.path.length>s.length+1||0>=function(e,t){let r=e.readTime.compareTo(t.readTime);return 0!==r?r:0!==(r=H.comparator(e.documentKey,t.documentKey))?r:F(e.largestBatchId,t.largestBatchId)}(new Y(a.readTime,a.key,-1),r)||(i.has(a.key)||to(t,a))&&(n=n.insert(a.key,a.mutableCopy()))}return J.resolve(n)}getAllFromCollectionGroup(e,t,r,i){I(9500)}si(e,t){return J.forEach(this.docs,e=>t(e))}newChangeBuffer(e){return new t4(this)}getSize(e){return J.resolve(this.size)}}class t4 extends tX{constructor(e){super(),this.Br=e}applyChanges(e){let t=[];return this.changes.forEach((r,i)=>{i.isValidDocument()?t.push(this.Br.addEntry(e,i)):this.Br.removeEntry(r)}),J.waitFor(t)}getFromCache(e,t){return this.Br.getEntry(e,t)}getAllFromCache(e,t){return this.Br.getEntries(e,t)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class t3{constructor(e){this.persistence=e,this.oi=new tl(e=>e6(e),e7),this.lastRemoteSnapshotVersion=q.min(),this.highestTargetId=0,this._i=0,this.ai=new t1,this.targetCount=0,this.ui=tH.cr()}forEachTarget(e,t){return this.oi.forEach((e,r)=>t(r)),J.resolve()}getLastRemoteSnapshotVersion(e){return J.resolve(this.lastRemoteSnapshotVersion)}getHighestSequenceNumber(e){return J.resolve(this._i)}allocateTargetId(e){return this.highestTargetId=this.ui.next(),J.resolve(this.highestTargetId)}setTargetsMetadata(e,t,r){return r&&(this.lastRemoteSnapshotVersion=r),t>this._i&&(this._i=t),J.resolve()}Tr(e){this.oi.set(e.target,e);let t=e.targetId;t>this.highestTargetId&&(this.ui=new tH(t),this.highestTargetId=t),e.sequenceNumber>this._i&&(this._i=e.sequenceNumber)}addTargetData(e,t){return this.Tr(t),this.targetCount+=1,J.resolve()}updateTargetData(e,t){return this.Tr(t),J.resolve()}removeTargetData(e,t){return this.oi.delete(t.target),this.ai.Hr(t.targetId),this.targetCount-=1,J.resolve()}removeTargets(e,t,r){let i=0,n=[];return this.oi.forEach((s,a)=>{a.sequenceNumber<=t&&null===r.get(a.targetId)&&(this.oi.delete(s),n.push(this.removeMatchingKeysForTargetId(e,a.targetId)),i++)}),J.waitFor(n).next(()=>i)}getTargetCount(e){return J.resolve(this.targetCount)}getTargetData(e,t){let r=this.oi.get(t)||null;return J.resolve(r)}addMatchingKeys(e,t,r){return this.ai.Gr(t,r),J.resolve()}removeMatchingKeys(e,t,r){this.ai.jr(t,r);let i=this.persistence.referenceDelegate,n=[];return i&&t.forEach(t=>{n.push(i.markPotentiallyOrphaned(e,t))}),J.waitFor(n)}removeMatchingKeysForTargetId(e,t){return this.ai.Hr(t),J.resolve()}getMatchingKeysForTargetId(e,t){let r=this.ai.Yr(t);return J.resolve(r)}containsKey(e,t){return J.resolve(this.ai.containsKey(t))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class t6{constructor(e,t){this.ci={},this.overlays={},this.li=new ee(0),this.hi=!1,this.hi=!0,this.Pi=new t0,this.referenceDelegate=e(this),this.Ti=new t3(this),this.indexManager=new tz,this.remoteDocumentCache=new t9(e=>this.referenceDelegate.Ii(e)),this.serializer=new tK(t),this.Ei=new tJ(this.serializer)}start(){return Promise.resolve()}shutdown(){return this.hi=!1,Promise.resolve()}get started(){return this.hi}setDatabaseDeletedListener(){}setNetworkEnabled(){}getIndexManager(e){return this.indexManager}getDocumentOverlayCache(e){let t=this.overlays[e.toKey()];return t||(t=new tZ,this.overlays[e.toKey()]=t),t}getMutationQueue(e,t){let r=this.ci[e.toKey()];return r||(r=new t5(t,this.referenceDelegate),this.ci[e.toKey()]=r),r}getGlobalsCache(){return this.Pi}getTargetCache(){return this.Ti}getRemoteDocumentCache(){return this.remoteDocumentCache}getBundleCache(){return this.Ei}runTransaction(e,t,r){E("MemoryPersistence","Starting transaction:",e);let i=new t7(this.li.next());return this.referenceDelegate.di(),r(i).next(e=>this.referenceDelegate.Ai(i).next(()=>e)).toPromise().then(e=>(i.raiseOnCommittedEvent(),e))}Ri(e,t){return J.or(Object.values(this.ci).map(r=>()=>r.containsKey(e,t)))}}class t7 extends W{constructor(e){super(),this.currentSequenceNumber=e}}class t8{constructor(e){this.persistence=e,this.Vi=new t1,this.mi=null}static fi(e){return new t8(e)}get gi(){if(this.mi)return this.mi;throw I(60996)}addReference(e,t,r){return this.Vi.addReference(r,t),this.gi.delete(r.toString()),J.resolve()}removeReference(e,t,r){return this.Vi.removeReference(r,t),this.gi.add(r.toString()),J.resolve()}markPotentiallyOrphaned(e,t){return this.gi.add(t.toString()),J.resolve()}removeTarget(e,t){this.Vi.Hr(t.targetId).forEach(e=>this.gi.add(e.toString()));let r=this.persistence.getTargetCache();return r.getMatchingKeysForTargetId(e,t.targetId).next(e=>{e.forEach(e=>this.gi.add(e.toString()))}).next(()=>r.removeTargetData(e,t))}di(){this.mi=new Set}Ai(e){let t=this.persistence.getRemoteDocumentCache().newChangeBuffer();return J.forEach(this.gi,r=>{let i=H.fromPath(r);return this.pi(e,i).next(e=>{e||t.removeEntry(i,q.min())})}).next(()=>(this.mi=null,t.apply(e)))}updateLimboDocument(e,t){return this.pi(e,t).next(e=>{e?this.gi.delete(t.toString()):this.gi.add(t.toString())})}Ii(e){return 0}pi(e,t){return J.or([()=>J.resolve(this.Vi.containsKey(t)),()=>this.persistence.getTargetCache().containsKey(e,t),()=>this.persistence.Ri(e,t)])}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class re{constructor(e,t,r,i){this.targetId=e,this.fromCache=t,this.ds=r,this.As=i}static Rs(e,t){let r=tf(),i=tf();for(let e of t.docChanges)switch(e.type){case 0:r=r.add(e.doc.key);break;case 1:i=i.add(e.doc.key)}return new re(e,t.fromCache,r,i)}}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class rt{constructor(){this._documentReadCount=0}get documentReadCount(){return this._documentReadCount}incrementDocumentReadCount(e){this._documentReadCount+=e}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class rr{constructor(){this.Vs=!1,this.fs=!1,this.gs=100,this.ps=(0,h.G6)()?8:function(e){let t=e.match(/Android ([\d.]+)/i);return Number(t?t[1].split(".").slice(0,2).join("."):"-1")}((0,h.z$)())>0?6:4}initialize(e,t){this.ys=e,this.indexManager=t,this.Vs=!0}getDocumentsMatchingQuery(e,t,r,i){let n={result:null};return this.ws(e,t).next(e=>{n.result=e}).next(()=>{if(!n.result)return this.bs(e,t,i,r).next(e=>{n.result=e})}).next(()=>{if(n.result)return;let r=new rt;return this.Ss(e,t,r).next(i=>{if(n.result=i,this.fs)return this.Ds(e,t,r,i.size)})}).next(()=>n.result)}Ds(e,t,r,i){return r.documentReadCount<this.gs?(v()<=u.in.DEBUG&&E("QueryEngine","SDK will not create cache indexes for query:",ta(t),"since it only creates cache indexes for collection contains","more than or equal to",this.gs,"documents"),J.resolve()):(v()<=u.in.DEBUG&&E("QueryEngine","Query:",ta(t),"scans",r.documentReadCount,"local documents and returns",i,"documents as results."),r.documentReadCount>this.ps*i?(v()<=u.in.DEBUG&&E("QueryEngine","The SDK decides to create cache indexes for query:",ta(t),"as using cache indexes may help improve performance."),this.indexManager.createTargetIndexes(e,tr(t))):J.resolve())}ws(e,t){if(te(t))return J.resolve(null);let r=tr(t);return this.indexManager.getIndexType(e,r).next(i=>0===i?null:(null!==t.limit&&1===i&&(r=tr(t=ti(t,null,"F"))),this.indexManager.getDocumentsMatchingTarget(e,r).next(i=>{let n=tf(...i);return this.ys.getDocuments(e,n).next(i=>this.indexManager.getMinOffset(e,r).next(r=>{let s=this.vs(t,i);return this.Cs(t,s,n,r.readTime)?this.ws(e,ti(t,null,"F")):this.Fs(e,s,t,r)}))})))}bs(e,t,r,i){return te(t)||i.isEqual(q.min())?J.resolve(null):this.ys.getDocuments(e,r).next(n=>{let s=this.vs(t,n);return this.Cs(t,s,r,i)?J.resolve(null):(v()<=u.in.DEBUG&&E("QueryEngine","Re-using previous result from %s to execute query: %s",i.toString(),ta(t)),this.Fs(e,s,t,function(e,t){let r=e.toTimestamp().seconds,i=e.toTimestamp().nanoseconds+1;return new Y(q.fromTimestamp(1e9===i?new $(r+1,0):new $(r,i)),H.empty(),-1)}(i,0)).next(e=>e))})}vs(e,t){let r=new eo((t,r)=>{let i=!1;for(let n of tt(e)){let e=function(e,t,r){let i=e.field.isKeyField()?H.comparator(t.key,r.key):function(e,t,r){let i=t.data.field(e),n=r.data.field(e);return null!==i&&null!==n?ex(i,n):I(42886)}(e.field,t,r);switch(e.dir){case"asc":return i;case"desc":return -1*i;default:return I(19790,{direction:e.dir})}}(n,t,r);if(0!==e)return e;i=i||n.field.isKeyField()}return 0});return t.forEach((t,i)=>{to(e,i)&&(r=r.add(i))}),r}Cs(e,t,r,i){if(null===e.limit)return!1;if(r.size!==t.size)return!0;let n="F"===e.limitType?t.last():t.first();return!!n&&(n.hasPendingWrites||n.version.compareTo(i)>0)}Ss(e,t,r){return v()<=u.in.DEBUG&&E("QueryEngine","Using full collection scan to execute query:",ta(t)),this.ys.getDocumentsMatchingQuery(e,t,Y.min(),r)}Fs(e,t,r,i){return this.ys.getDocumentsMatchingQuery(e,r,i).next(e=>(t.forEach(t=>{e=e.insert(t.key,t)}),e))}}class ri{constructor(e,t,r,i){this.persistence=e,this.Ms=t,this.serializer=i,this.xs=new en(F),this.Os=new tl(e=>e6(e),e7),this.Ns=new Map,this.Bs=e.getRemoteDocumentCache(),this.Ti=e.getTargetCache(),this.Ei=e.getBundleCache(),this.Ls(r)}Ls(e){this.documentOverlayCache=this.persistence.getDocumentOverlayCache(e),this.indexManager=this.persistence.getIndexManager(e),this.mutationQueue=this.persistence.getMutationQueue(e,this.indexManager),this.localDocuments=new tW(this.Bs,this.mutationQueue,this.documentOverlayCache,this.indexManager),this.Bs.setIndexManager(this.indexManager),this.Ms.initialize(this.localDocuments,this.indexManager)}collectGarbage(e){return this.persistence.runTransaction("Collect garbage","readwrite-primary",t=>e.collect(t,this.xs))}}async function rn(e,t){return await e.persistence.runTransaction("Handle user change","readonly",r=>{let i;return e.mutationQueue.getAllMutationBatches(r).next(n=>(i=n,e.Ls(t),e.mutationQueue.getAllMutationBatches(r))).next(t=>{let n=[],s=[],a=tf();for(let e of i)for(let t of(n.push(e.batchId),e.mutations))a=a.add(t.key);for(let e of t)for(let t of(s.push(e.batchId),e.mutations))a=a.add(t.key);return e.localDocuments.getDocuments(r,a).next(e=>({ks:e,removedBatchIds:n,addedBatchIds:s}))})})}class rs{constructor(){this.activeTargetIds=tg}js(e){this.activeTargetIds=this.activeTargetIds.add(e)}Hs(e){this.activeTargetIds=this.activeTargetIds.delete(e)}zs(){return JSON.stringify({activeTargetIds:this.activeTargetIds.toArray(),updateTimeMs:Date.now()})}}class ra{constructor(){this.xo=new rs,this.Oo={},this.onlineStateHandler=null,this.sequenceNumberHandler=null}addPendingMutation(e){}updateMutationState(e,t,r){}addLocalQueryTarget(e,t=!0){return t&&this.xo.js(e),this.Oo[e]||"not-current"}updateQueryState(e,t,r){this.Oo[e]=t}removeLocalQueryTarget(e){this.xo.Hs(e)}isLocalQueryTarget(e){return this.xo.activeTargetIds.has(e)}clearQueryState(e){delete this.Oo[e]}getAllActiveQueryTargets(){return this.xo.activeTargetIds}isActiveQueryTarget(e){return this.xo.activeTargetIds.has(e)}start(){return this.xo=new rs,Promise.resolve()}handleUserChange(e,t,r){}setOnlineState(e){}shutdown(){}writeSequenceNumber(e){}notifyBundleLoaded(e){}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ro{No(e){}shutdown(){}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let rl="ConnectivityMonitor";class ru{constructor(){this.Bo=()=>this.Lo(),this.ko=()=>this.qo(),this.Qo=[],this.$o()}No(e){this.Qo.push(e)}shutdown(){window.removeEventListener("online",this.Bo),window.removeEventListener("offline",this.ko)}$o(){window.addEventListener("online",this.Bo),window.addEventListener("offline",this.ko)}Lo(){for(let e of(E(rl,"Network connectivity changed: AVAILABLE"),this.Qo))e(0)}qo(){for(let e of(E(rl,"Network connectivity changed: UNAVAILABLE"),this.Qo))e(1)}static C(){return"undefined"!=typeof window&&void 0!==window.addEventListener&&void 0!==window.removeEventListener}}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let rh=null;function rc(){return null===rh?rh=268435456+Math.round(2147483648*Math.random()):rh++,"0x"+rh.toString(16)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let rd="RestConnection",rm={BatchGetDocuments:"batchGet",Commit:"commit",RunQuery:"runQuery",RunAggregationQuery:"runAggregationQuery"};class rf{get Uo(){return!1}constructor(e){this.databaseInfo=e,this.databaseId=e.databaseId;let t=e.ssl?"https":"http",r=encodeURIComponent(this.databaseId.projectId),i=encodeURIComponent(this.databaseId.database);this.Ko=t+"://"+e.host,this.Wo=`projects/${r}/databases/${i}`,this.Go=this.databaseId.database===eA?`project_id=${r}`:`project_id=${r}&database_id=${i}`}zo(e,t,r,i,n){let s=rc(),a=this.jo(e,t.toUriEncodedString());E(rd,`Sending RPC '${e}' ${s}:`,a,r);let o={"google-cloud-resource-prefix":this.Wo,"x-goog-request-params":this.Go};this.Ho(o,i,n);let{host:l}=new URL(a),u=(0,h.Xx)(l);return this.Jo(e,a,o,r,u).then(t=>(E(rd,`Received RPC '${e}' ${s}: `,t),t),t=>{throw T(rd,`RPC '${e}' ${s} failed with error: `,t,"url: ",a,"request:",r),t})}Yo(e,t,r,i,n,s){return this.zo(e,t,r,i,n)}Ho(e,t,r){e["X-Goog-Api-Client"]="gl-js/ fire/"+p,e["Content-Type"]="text/plain",this.databaseInfo.appId&&(e["X-Firebase-GMPID"]=this.databaseInfo.appId),t&&t.headers.forEach((t,r)=>e[r]=t),r&&r.headers.forEach((t,r)=>e[r]=t)}jo(e,t){let r=rm[e];return`${this.Ko}/v1/${t}:${r}`}terminate(){}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class rg{constructor(e){this.Zo=e.Zo,this.Xo=e.Xo}e_(e){this.t_=e}n_(e){this.r_=e}i_(e){this.s_=e}onMessage(e){this.o_=e}close(){this.Xo()}send(e){this.Zo(e)}__(){this.t_()}a_(){this.r_()}u_(e){this.s_(e)}c_(e){this.o_(e)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let rp="WebChannelConnection";class ry extends rf{constructor(e){super(e),this.l_=[],this.forceLongPolling=e.forceLongPolling,this.autoDetectLongPolling=e.autoDetectLongPolling,this.useFetchStreams=e.useFetchStreams,this.longPollingOptions=e.longPollingOptions}Jo(e,t,r,i,n){let s=rc();return new Promise((n,a)=>{let o=new d.JJ;o.setWithCredentials(!0),o.listenOnce(d.tw.COMPLETE,()=>{try{switch(o.getLastErrorCode()){case d.jK.NO_ERROR:let t=o.getResponseJson();E(rp,`XHR for RPC '${e}' ${s} received:`,JSON.stringify(t)),n(t);break;case d.jK.TIMEOUT:E(rp,`RPC '${e}' ${s} timed out`),a(new C(S.DEADLINE_EXCEEDED,"Request time out"));break;case d.jK.HTTP_ERROR:let r=o.getStatus();if(E(rp,`RPC '${e}' ${s} failed with status:`,r,"response text:",o.getResponseText()),r>0){let e=o.getResponseJson();Array.isArray(e)&&(e=e[0]);let t=null==e?void 0:e.error;if(t&&t.status&&t.message){let e=function(e){let t=e.toLowerCase().replace(/_/g,"-");return Object.values(S).indexOf(t)>=0?t:S.UNKNOWN}(t.status);a(new C(e,t.message))}else a(new C(S.UNKNOWN,"Server responded with status "+o.getStatus()))}else a(new C(S.UNAVAILABLE,"Connection failed."));break;default:I(9055,{h_:e,streamId:s,P_:o.getLastErrorCode(),T_:o.getLastError()})}}finally{E(rp,`RPC '${e}' ${s} completed.`)}});let l=JSON.stringify(i);E(rp,`RPC '${e}' ${s} sending request:`,i),o.send(t,"POST",l,r,15)})}I_(e,t,r){let n=rc(),s=[this.Ko,"/","google.firestore.v1.Firestore","/",e,"/channel"],a=(0,d.UE)(),o=(0,d.FJ)(),l={httpSessionIdParam:"gsessionid",initMessageHeaders:{},messageUrlParams:{database:`projects/${this.databaseId.projectId}/databases/${this.databaseId.database}`},sendRawJson:!0,supportsCrossDomainXhr:!0,internalChannelParams:{forwardChannelRequestTimeoutMs:6e5},forceLongPolling:this.forceLongPolling,detectBufferingProxy:this.autoDetectLongPolling},u=this.longPollingOptions.timeoutSeconds;void 0!==u&&(l.longPollingTimeout=Math.round(1e3*u)),this.useFetchStreams&&(l.useFetchStreams=!0),this.Ho(l.initMessageHeaders,t,r),l.encodeInitMessageHeaders=!0;let h=s.join("");E(rp,`Creating RPC '${e}' stream ${n}: ${h}`,l);let c=a.createWebChannel(h,l);this.E_(c);let m=!1,f=!1,g=new rg({Zo:t=>{f?E(rp,`Not sending because RPC '${e}' stream ${n} is closed:`,t):(m||(E(rp,`Opening RPC '${e}' stream ${n} transport.`),c.open(),m=!0),E(rp,`RPC '${e}' stream ${n} sending:`,t),c.send(t))},Xo:()=>c.close()}),p=(e,t,r)=>{e.listen(t,e=>{try{r(e)}catch(e){setTimeout(()=>{throw e},0)}})};return p(c,d.ii.EventType.OPEN,()=>{f||(E(rp,`RPC '${e}' stream ${n} transport opened.`),g.__())}),p(c,d.ii.EventType.CLOSE,()=>{f||(f=!0,E(rp,`RPC '${e}' stream ${n} transport closed`),g.u_(),this.d_(c))}),p(c,d.ii.EventType.ERROR,t=>{f||(f=!0,T(rp,`RPC '${e}' stream ${n} transport errored. Name:`,t.name,"Message:",t.message),g.u_(new C(S.UNAVAILABLE,"The operation could not be completed")))}),p(c,d.ii.EventType.MESSAGE,t=>{var r;if(!f){let s=t.data[0];_(!!s,16349);let a=(null==s?void 0:s.error)||(null===(r=s[0])||void 0===r?void 0:r.error);if(a){E(rp,`RPC '${e}' stream ${n} received error:`,a);let t=a.status,r=function(e){let t=i[e];if(void 0!==t)return function(e){if(void 0===e)return w("GRPC error has no .code"),S.UNKNOWN;switch(e){case i.OK:return S.OK;case i.CANCELLED:return S.CANCELLED;case i.UNKNOWN:return S.UNKNOWN;case i.DEADLINE_EXCEEDED:return S.DEADLINE_EXCEEDED;case i.RESOURCE_EXHAUSTED:return S.RESOURCE_EXHAUSTED;case i.INTERNAL:return S.INTERNAL;case i.UNAVAILABLE:return S.UNAVAILABLE;case i.UNAUTHENTICATED:return S.UNAUTHENTICATED;case i.INVALID_ARGUMENT:return S.INVALID_ARGUMENT;case i.NOT_FOUND:return S.NOT_FOUND;case i.ALREADY_EXISTS:return S.ALREADY_EXISTS;case i.PERMISSION_DENIED:return S.PERMISSION_DENIED;case i.FAILED_PRECONDITION:return S.FAILED_PRECONDITION;case i.ABORTED:return S.ABORTED;case i.OUT_OF_RANGE:return S.OUT_OF_RANGE;case i.UNIMPLEMENTED:return S.UNIMPLEMENTED;case i.DATA_LOSS:return S.DATA_LOSS;default:return I(39323,{code:e})}}(t)}(t),s=a.message;void 0===r&&(r=S.INTERNAL,s="Unknown error status: "+t+" with message "+a.message),f=!0,g.u_(new C(r,s)),c.close()}else E(rp,`RPC '${e}' stream ${n} received:`,s),g.c_(s)}}),p(o,d.ju.STAT_EVENT,t=>{t.stat===d.kN.PROXY?E(rp,`RPC '${e}' stream ${n} detected buffering proxy`):t.stat===d.kN.NOPROXY&&E(rp,`RPC '${e}' stream ${n} detected no buffering proxy`)}),setTimeout(()=>{g.a_()},0),g}terminate(){this.l_.forEach(e=>e.close()),this.l_=[]}E_(e){this.l_.push(e)}d_(e){this.l_=this.l_.filter(t=>t===e)}}function rv(){return"undefined"!=typeof document?document:null}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class rE{constructor(e,t,r=1e3,i=1.5,n=6e4){this.xi=e,this.timerId=t,this.A_=r,this.R_=i,this.V_=n,this.m_=0,this.f_=null,this.g_=Date.now(),this.reset()}reset(){this.m_=0}p_(){this.m_=this.V_}y_(e){this.cancel();let t=Math.floor(this.m_+this.w_()),r=Math.max(0,Date.now()-this.g_),i=Math.max(0,t-r);i>0&&E("ExponentialBackoff",`Backing off for ${i} ms (base delay: ${this.m_} ms, delay with jitter: ${t} ms, last attempt: ${r} ms ago)`),this.f_=this.xi.enqueueAfterDelay(this.timerId,i,()=>(this.g_=Date.now(),e())),this.m_*=this.R_,this.m_<this.A_&&(this.m_=this.A_),this.m_>this.V_&&(this.m_=this.V_)}b_(){null!==this.f_&&(this.f_.skipDelay(),this.f_=null)}cancel(){null!==this.f_&&(this.f_.cancel(),this.f_=null)}w_(){return(Math.random()-.5)*this.m_}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class rw{}class rT extends rw{constructor(e,t,r,i){super(),this.authCredentials=e,this.appCheckCredentials=t,this.connection=r,this.serializer=i,this.sa=!1}oa(){if(this.sa)throw new C(S.FAILED_PRECONDITION,"The client has already been terminated.")}zo(e,t,r,i){return this.oa(),Promise.all([this.authCredentials.getToken(),this.appCheckCredentials.getToken()]).then(([n,s])=>this.connection.zo(e,t$(t,r),i,n,s)).catch(e=>{throw"FirebaseError"===e.name?(e.code===S.UNAUTHENTICATED&&(this.authCredentials.invalidateToken(),this.appCheckCredentials.invalidateToken()),e):new C(S.UNKNOWN,e.toString())})}Yo(e,t,r,i,n){return this.oa(),Promise.all([this.authCredentials.getToken(),this.appCheckCredentials.getToken()]).then(([s,a])=>this.connection.Yo(e,t$(t,r),i,s,a,n)).catch(e=>{throw"FirebaseError"===e.name?(e.code===S.UNAUTHENTICATED&&(this.authCredentials.invalidateToken(),this.appCheckCredentials.invalidateToken()),e):new C(S.UNKNOWN,e.toString())})}terminate(){this.sa=!0,this.connection.terminate()}}class rA{constructor(e,t){this.asyncQueue=e,this.onlineStateHandler=t,this.state="Unknown",this._a=0,this.aa=null,this.ua=!0}ca(){0===this._a&&(this.la("Unknown"),this.aa=this.asyncQueue.enqueueAfterDelay("online_state_timeout",1e4,()=>(this.aa=null,this.ha("Backend didn't respond within 10 seconds."),this.la("Offline"),Promise.resolve())))}Pa(e){"Online"===this.state?this.la("Unknown"):(this._a++,this._a>=1&&(this.Ta(),this.ha(`Connection failed 1 times. Most recent error: ${e.toString()}`),this.la("Offline")))}set(e){this.Ta(),this._a=0,"Online"===e&&(this.ua=!1),this.la(e)}la(e){e!==this.state&&(this.state=e,this.onlineStateHandler(e))}ha(e){let t=`Could not reach Cloud Firestore backend. ${e}
This typically indicates that your device does not have a healthy Internet connection at the moment. The client will operate in offline mode until it is able to successfully connect to the backend.`;this.ua?(w(t),this.ua=!1):E("OnlineStateTracker",t)}Ta(){null!==this.aa&&(this.aa.cancel(),this.aa=null)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let rI="RemoteStore";class rN{constructor(e,t,r,i,n){this.localStore=e,this.datastore=t,this.asyncQueue=r,this.remoteSyncer={},this.Ia=[],this.Ea=new Map,this.da=new Set,this.Aa=[],this.Ra=n,this.Ra.No(e=>{r.enqueueAndForget(async()=>{rC(this)&&(E(rI,"Restarting streams for network reachability change."),await async function(e){e.da.add(4),await rS(e),e.Va.set("Unknown"),e.da.delete(4),await r_(e)}(this))})}),this.Va=new rA(r,i)}}async function r_(e){if(rC(e))for(let t of e.Aa)await t(!0)}async function rS(e){for(let t of e.Aa)await t(!1)}function rC(e){return 0===e.da.size}async function rk(e,t){t?(e.da.delete(2),await r_(e)):t||(e.da.add(2),await rS(e),e.Va.set("Unknown"))}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class rD{constructor(e,t,r,i,n){this.asyncQueue=e,this.timerId=t,this.targetTimeMs=r,this.op=i,this.removalCallback=n,this.deferred=new k,this.then=this.deferred.promise.then.bind(this.deferred.promise),this.deferred.promise.catch(e=>{})}get promise(){return this.deferred.promise}static createAndSchedule(e,t,r,i,n){let s=new rD(e,t,Date.now()+r,i,n);return s.start(r),s}start(e){this.timerHandle=setTimeout(()=>this.handleDelayElapsed(),e)}skipDelay(){return this.handleDelayElapsed()}cancel(e){null!==this.timerHandle&&(this.clearTimeout(),this.deferred.reject(new C(S.CANCELLED,"Operation cancelled"+(e?": "+e:""))))}handleDelayElapsed(){this.asyncQueue.enqueueAndForget(()=>null!==this.timerHandle?(this.clearTimeout(),this.op().then(e=>this.deferred.resolve(e))):Promise.resolve())}clearTimeout(){null!==this.timerHandle&&(this.removalCallback(this),clearTimeout(this.timerHandle),this.timerHandle=null)}}class rx{constructor(){this.queries=rR(),this.onlineState="Unknown",this.Ca=new Set}terminate(){!function(e,t){let r=e.queries;e.queries=rR(),r.forEach((e,r)=>{for(let e of r.Sa)e.onError(t)})}(this,new C(S.ABORTED,"Firestore shutting down"))}}function rR(){return new tl(e=>ts(e),tn)}(a=s||(s={})).xa="default",a.Cache="cache";class rV{constructor(e,t,r,i,n,s){this.localStore=e,this.remoteStore=t,this.eventManager=r,this.sharedClientState=i,this.currentUser=n,this.maxConcurrentLimboResolutions=s,this.lu={},this.hu=new tl(e=>ts(e),tn),this.Pu=new Map,this.Tu=new Set,this.Iu=new en(H.comparator),this.Eu=new Map,this.du=new t1,this.Au={},this.Ru=new Map,this.Vu=tH.lr(),this.onlineState="Unknown",this.mu=void 0}get isPrimaryClient(){return!0===this.mu}}function rb(e,t,r){var i;if(e.isPrimaryClient&&0===r||!e.isPrimaryClient&&1===r){let r;let n=[];e.hu.forEach((e,r)=>{let i=r.view.Fa(t);i.snapshot&&n.push(i.snapshot)}),(i=e.eventManager).onlineState=t,r=!1,i.queries.forEach((e,i)=>{for(let e of i.Sa)e.Fa(t)&&(r=!0)}),r&&function(e){e.Ca.forEach(e=>{e.next()})}(i),n.length&&e.lu.Y_(n),e.onlineState=t,e.isPrimaryClient&&e.sharedClientState.setOnlineState(t)}}async function rO(e,t,r){let i=[],n=[],s=[];e.hu.isEmpty()||(e.hu.forEach((a,o)=>{s.push(e.fu(o,t,r).then(t=>{var s;if((t||r)&&e.isPrimaryClient){let i=t?!t.fromCache:null===(s=null==r?void 0:r.targetChanges.get(o.targetId))||void 0===s?void 0:s.current;e.sharedClientState.updateQueryState(o.targetId,i?"current":"not-current")}if(t){i.push(t);let e=re.Rs(o.targetId,t);n.push(e)}}))}),await Promise.all(s),e.lu.Y_(i),await async function(e,t){try{await e.persistence.runTransaction("notifyLocalViewChanges","readwrite",r=>J.forEach(t,t=>J.forEach(t.ds,i=>e.persistence.referenceDelegate.addReference(r,t.targetId,i)).next(()=>J.forEach(t.As,i=>e.persistence.referenceDelegate.removeReference(r,t.targetId,i)))))}catch(e){if(!Z(e))throw e;E("LocalStore","Failed to update sequence numbers: "+e)}for(let r of t){let t=r.targetId;if(!r.fromCache){let r=e.xs.get(t),i=r.snapshotVersion,n=r.withLastLimboFreeSnapshotVersion(i);e.xs=e.xs.insert(t,n)}}}(e.localStore,n))}async function rL(e,t){var r;if(!e.currentUser.isEqual(t)){E("SyncEngine","User change. New user:",t.toKey());let i=await rn(e.localStore,t);e.currentUser=t,r="'waitForPendingWrites' promise is rejected due to a user change.",e.Ru.forEach(e=>{e.forEach(e=>{e.reject(new C(S.CANCELLED,r))})}),e.Ru.clear(),e.sharedClientState.handleUserChange(t,i.removedBatchIds,i.addedBatchIds),await rO(e,i.ks)}}class rM{constructor(){this.kind="memory",this.synchronizeTabs=!1}async initialize(e){this.serializer=new tU(e.databaseInfo.databaseId,!0),this.sharedClientState=this.bu(e),this.persistence=this.Su(e),await this.persistence.start(),this.localStore=this.Du(e),this.gcScheduler=this.vu(e,this.localStore),this.indexBackfillerScheduler=this.Cu(e,this.localStore)}vu(e,t){return null}Cu(e,t){return null}Du(e){var t;return t=this.persistence,new ri(t,new rr,e.initialUser,this.serializer)}Su(e){return new t6(t8.fi,this.serializer)}bu(e){return new ra}async terminate(){var e,t;null===(e=this.gcScheduler)||void 0===e||e.stop(),null===(t=this.indexBackfillerScheduler)||void 0===t||t.stop(),this.sharedClientState.shutdown(),await this.persistence.shutdown()}}rM.provider={build:()=>new rM};class rF{async initialize(e,t){this.localStore||(this.localStore=e.localStore,this.sharedClientState=e.sharedClientState,this.datastore=this.createDatastore(t),this.remoteStore=this.createRemoteStore(t),this.eventManager=this.createEventManager(t),this.syncEngine=this.createSyncEngine(t,!e.synchronizeTabs),this.sharedClientState.onlineStateHandler=e=>rb(this.syncEngine,e,1),this.remoteStore.remoteSyncer.handleCredentialChange=rL.bind(null,this.syncEngine),await rk(this.remoteStore,this.syncEngine.isPrimaryClient))}createEventManager(e){return new rx}createDatastore(e){let t=new tU(e.databaseInfo.databaseId,!0),r=new ry(e.databaseInfo);return new rT(e.authCredentials,e.appCheckCredentials,r,t)}createRemoteStore(e){var t;return t=this.localStore,new rN(t,this.datastore,e.asyncQueue,e=>rb(this.syncEngine,e,0),ru.C()?new ru:new ro)}createSyncEngine(e,t){return function(e,t,r,i,n,s,a){let o=new rV(e,t,r,i,n,s);return a&&(o.mu=!0),o}(this.localStore,this.remoteStore,this.eventManager,this.sharedClientState,e.initialUser,e.maxConcurrentLimboResolutions,t)}async terminate(){var e,t;await async function(e){E(rI,"RemoteStore shutting down."),e.da.add(5),await rS(e),e.Ra.shutdown(),e.Va.set("Unknown")}(this.remoteStore),null===(e=this.datastore)||void 0===e||e.terminate(),null===(t=this.eventManager)||void 0===t||t.terminate()}}rF.provider={build:()=>new rF};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let rP=new Map,rU="firestore.googleapis.com";class rB{constructor(e){var t,r;if(void 0===e.host){if(void 0!==e.ssl)throw new C(S.INVALID_ARGUMENT,"Can't provide ssl option if host option is not set");this.host=rU,this.ssl=!0}else this.host=e.host,this.ssl=null===(t=e.ssl)||void 0===t||t;if(this.isUsingEmulator=void 0!==e.emulatorOptions,this.credentials=e.credentials,this.ignoreUndefinedProperties=!!e.ignoreUndefinedProperties,this.localCache=e.localCache,void 0===e.cacheSizeBytes)this.cacheSizeBytes=41943040;else{if(-1!==e.cacheSizeBytes&&e.cacheSizeBytes<1048576)throw new C(S.INVALID_ARGUMENT,"cacheSizeBytes must be at least 1048576");this.cacheSizeBytes=e.cacheSizeBytes}(function(e,t,r,i){if(!0===t&&!0===i)throw new C(S.INVALID_ARGUMENT,`${e} and ${r} cannot be used together.`)})("experimentalForceLongPolling",e.experimentalForceLongPolling,"experimentalAutoDetectLongPolling",e.experimentalAutoDetectLongPolling),this.experimentalForceLongPolling=!!e.experimentalForceLongPolling,this.experimentalForceLongPolling?this.experimentalAutoDetectLongPolling=!1:void 0===e.experimentalAutoDetectLongPolling?this.experimentalAutoDetectLongPolling=!0:this.experimentalAutoDetectLongPolling=!!e.experimentalAutoDetectLongPolling,this.experimentalLongPollingOptions=/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function(e){let t={};return void 0!==e.timeoutSeconds&&(t.timeoutSeconds=e.timeoutSeconds),t}(null!==(r=e.experimentalLongPollingOptions)&&void 0!==r?r:{}),function(e){if(void 0!==e.timeoutSeconds){if(isNaN(e.timeoutSeconds))throw new C(S.INVALID_ARGUMENT,`invalid long polling timeout: ${e.timeoutSeconds} (must not be NaN)`);if(e.timeoutSeconds<5)throw new C(S.INVALID_ARGUMENT,`invalid long polling timeout: ${e.timeoutSeconds} (minimum allowed value is 5)`);if(e.timeoutSeconds>30)throw new C(S.INVALID_ARGUMENT,`invalid long polling timeout: ${e.timeoutSeconds} (maximum allowed value is 30)`)}}(this.experimentalLongPollingOptions),this.useFetchStreams=!!e.useFetchStreams}isEqual(e){var t,r;return this.host===e.host&&this.ssl===e.ssl&&this.credentials===e.credentials&&this.cacheSizeBytes===e.cacheSizeBytes&&this.experimentalForceLongPolling===e.experimentalForceLongPolling&&this.experimentalAutoDetectLongPolling===e.experimentalAutoDetectLongPolling&&(t=this.experimentalLongPollingOptions,r=e.experimentalLongPollingOptions,t.timeoutSeconds===r.timeoutSeconds)&&this.ignoreUndefinedProperties===e.ignoreUndefinedProperties&&this.useFetchStreams===e.useFetchStreams}}class r${constructor(e,t,r,i){this._authCredentials=e,this._appCheckCredentials=t,this._databaseId=r,this._app=i,this.type="firestore-lite",this._persistenceKey="(lite)",this._settings=new rB({}),this._settingsFrozen=!1,this._emulatorOptions={},this._terminateTask="notTerminated"}get app(){if(!this._app)throw new C(S.FAILED_PRECONDITION,"Firestore was not initialized using the Firebase SDK. 'app' is not available");return this._app}get _initialized(){return this._settingsFrozen}get _terminated(){return"notTerminated"!==this._terminateTask}_setSettings(e){if(this._settingsFrozen)throw new C(S.FAILED_PRECONDITION,"Firestore has already been started and its settings can no longer be changed. You can only modify settings before calling any other methods on a Firestore object.");this._settings=new rB(e),this._emulatorOptions=e.emulatorOptions||{},void 0!==e.credentials&&(this._authCredentials=function(e){if(!e)return new x;switch(e.type){case"firstParty":return new O(e.sessionIndex||"0",e.iamToken||null,e.authTokenFactory||null);case"provider":return e.client;default:throw new C(S.INVALID_ARGUMENT,"makeAuthCredentialsProvider failed due to invalid credential type")}}(e.credentials))}_getSettings(){return this._settings}_getEmulatorOptions(){return this._emulatorOptions}_freezeSettings(){return this._settingsFrozen=!0,this._settings}_delete(){return"notTerminated"===this._terminateTask&&(this._terminateTask=this._terminate()),this._terminateTask}async _restart(){"notTerminated"===this._terminateTask?await this._terminate():this._terminateTask="notTerminated"}toJSON(){return{app:this._app,databaseId:this._databaseId,settings:this._settings}}_terminate(){return function(e){let t=rP.get(e);t&&(E("ComponentProvider","Removing Datastore"),rP.delete(e),t.terminate())}(this),Promise.resolve()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let rq="AsyncQueue";class rK{constructor(e=Promise.resolve()){this.Ju=[],this.Yu=!1,this.Zu=[],this.Xu=null,this.ec=!1,this.tc=!1,this.nc=[],this.x_=new rE(this,"async_queue_retry"),this.rc=()=>{let e=rv();e&&E(rq,"Visibility state changed to "+e.visibilityState),this.x_.b_()},this.sc=e;let t=rv();t&&"function"==typeof t.addEventListener&&t.addEventListener("visibilitychange",this.rc)}get isShuttingDown(){return this.Yu}enqueueAndForget(e){this.enqueue(e)}enqueueAndForgetEvenWhileRestricted(e){this.oc(),this._c(e)}enterRestrictedMode(e){if(!this.Yu){this.Yu=!0,this.tc=e||!1;let t=rv();t&&"function"==typeof t.removeEventListener&&t.removeEventListener("visibilitychange",this.rc)}}enqueue(e){if(this.oc(),this.Yu)return new Promise(()=>{});let t=new k;return this._c(()=>this.Yu&&this.tc?Promise.resolve():(e().then(t.resolve,t.reject),t.promise)).then(()=>t.promise)}enqueueRetryable(e){this.enqueueAndForget(()=>(this.Ju.push(e),this.ac()))}async ac(){if(0!==this.Ju.length){try{await this.Ju[0](),this.Ju.shift(),this.x_.reset()}catch(e){if(!Z(e))throw e;E(rq,"Operation failed with retryable error: "+e)}this.Ju.length>0&&this.x_.y_(()=>this.ac())}}_c(e){let t=this.sc.then(()=>(this.ec=!0,e().catch(e=>{throw this.Xu=e,this.ec=!1,w("INTERNAL UNHANDLED ERROR: ",rQ(e)),e}).then(e=>(this.ec=!1,e))));return this.sc=t,t}enqueueAfterDelay(e,t,r){this.oc(),this.nc.indexOf(e)>-1&&(t=0);let i=rD.createAndSchedule(this,e,t,r,e=>this.uc(e));return this.Zu.push(i),i}oc(){this.Xu&&I(47125,{cc:rQ(this.Xu)})}verifyOperationInProgress(){}async lc(){let e;do e=this.sc,await e;while(e!==this.sc)}hc(e){for(let t of this.Zu)if(t.timerId===e)return!0;return!1}Pc(e){return this.lc().then(()=>{for(let t of(this.Zu.sort((e,t)=>e.targetTimeMs-t.targetTimeMs),this.Zu))if(t.skipDelay(),"all"!==e&&t.timerId===e)break;return this.lc()})}Tc(e){this.nc.push(e)}uc(e){let t=this.Zu.indexOf(e);this.Zu.splice(t,1)}}function rQ(e){let t=e.message||"";return e.stack&&(t=e.stack.includes(e.message)?e.stack:e.message+"\n"+e.stack),t}class rz extends r${constructor(e,t,r,i){super(e,t,r,i),this.type="firestore",this._queue=new rK,this._persistenceKey=(null==i?void 0:i.name)||"[DEFAULT]"}async _terminate(){if(this._firestoreClient){let e=this._firestoreClient.terminate();this._queue=new rK(e),this._firestoreClient=void 0,await e}}}function rG(e,t){let r="object"==typeof e?e:(0,o.Mq)(),i=(0,o.qX)(r,"firestore").getImmediate({identifier:"string"==typeof e?e:t||eA});if(!i._initialized){let e=(0,h.P0)("firestore");e&&function(e,t,r,i={}){var n;e=function(e,t){if("_delegate"in e&&(e=e._delegate),!(e instanceof t)){if(t.name===e.constructor.name)throw new C(S.INVALID_ARGUMENT,"Type does not match the expected instance. Did you pass a reference from a different Firestore SDK?");{let r=function(e){if(void 0===e)return"undefined";if(null===e)return"null";if("string"==typeof e)return e.length>20&&(e=`${e.substring(0,20)}...`),JSON.stringify(e);if("number"==typeof e||"boolean"==typeof e)return""+e;if("object"==typeof e){if(e instanceof Array)return"an array";{var t;let r=(t=e).constructor?t.constructor.name:null;return r?`a custom ${r} object`:"an object"}}return"function"==typeof e?"a function":I(12329,{type:typeof e})}(e);throw new C(S.INVALID_ARGUMENT,`Expected type '${t.name}', but it was: ${r}`)}}return e}(e,r$);let s=(0,h.Xx)(t),a=e._getSettings(),o=Object.assign(Object.assign({},a),{emulatorOptions:e._getEmulatorOptions()}),l=`${t}:${r}`;s&&((0,h.Uo)(`https://${l}`),(0,h.dp)("Firestore",!0)),a.host!==rU&&a.host!==l&&T("Host has been set in both settings() and connectFirestoreEmulator(), emulator host will be used.");let u=Object.assign(Object.assign({},a),{host:l,ssl:s,emulatorOptions:i});if(!(0,h.vZ)(u,o)&&(e._setSettings(u),i.mockUserToken)){let t,r;if("string"==typeof i.mockUserToken)t=i.mockUserToken,r=g.MOCK_USER;else{t=(0,h.Sg)(i.mockUserToken,null===(n=e._app)||void 0===n?void 0:n.options.projectId);let s=i.mockUserToken.sub||i.mockUserToken.user_id;if(!s)throw new C(S.INVALID_ARGUMENT,"mockUserToken must contain 'sub' or 'user_id' field!");r=new g(s)}e._authCredentials=new R(new D(t,r))}}(i,...e)}return i}RegExp("[~\\*/\\[\\]]"),new WeakMap,function(e=!0){p=o.Jn,(0,o.Xd)(new l.wA("firestore",(t,{instanceIdentifier:r,options:i})=>{let n=t.getProvider("app").getImmediate(),s=new rz(new V(t.getProvider("auth-internal")),new M(n,t.getProvider("app-check-internal")),function(e,t){if(!Object.prototype.hasOwnProperty.apply(e.options,["projectId"]))throw new C(S.INVALID_ARGUMENT,'"projectId" not provided in firebase.initializeApp.');return new eI(e.options.projectId,t)}(n,r),n);return i=Object.assign({useFetchStreams:e},i),s._setSettings(i),s},"PUBLIC").setMultipleInstances(!0)),(0,o.KN)(m,f,void 0),(0,o.KN)(m,f,"esm2017")}()}}]);