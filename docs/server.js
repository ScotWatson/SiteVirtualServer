/*
(c) 2025 Scot Watson  All Rights Reserved
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

import * as Main from "./main.mjs";

// importScripts("https://scotwatson.github.io/WebCommon/MessageQueue.mjs");
// new MessageQueue(self);

Main.addNamedPort("request", handleRequest);
Main.addNamedPort("config", handleConfig);

function handleRequest(evt) {
  evt.target.postMessage({
    status: 200,
    statusText: "OK",
    headers: [],
    body: "",
  });
}

function handleConfig(evt) {
  
}
