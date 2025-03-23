/*
(c) 2025 Scot Watson  All Rights Reserved
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

import * as Main from "./main.mjs";

const controlled = new Promise((resolve) => {
  if (navigator.serviceWorker.controller !== null) {
    resolve();
    return;
  }
  navigator.serviceWorker.addEventListener("controllerchange", resolve);
});
navigator.serviceWorker.register("sw.js");
(async () => {
  await controlled;
  const serverPort = await openServiceWorkerPort("server", () => {});
  const moduleServerPort = await createServer(serverPort, "my-modules", () => {});
  const moduleContent = new Blob([ "export function hello() { console.log(\"Hello World!\"); }" ], { type: "application/javascript" });
  const uploadResponse = await fetch("https://my-modules/test.mjs", {
    method: "PUT",
    body: moduleContent,
  });
  if (uploadResponse.status === 200) {
    const test = await import("https://my-modules/test.mjs");
    test.hello();
  } else {
    console.error("Failed to upload https://my-modules/test.mjs");
  }
})();

async function openServiceWorkerPort(channelName, handler) {
  const swChannel = new MessageChannel();
  navigator.serviceWorker.controller.postMessage({
    name: channelName,
    port: swChannel.port2,
  }, [ swChannel.port2 ]);
  return await new Promise((resolve, reject) => {
    swChannel.port1.addEventListener("message", portInitialize);
    swChannel.port1.start();
    function portInitialize(evt) {
      evt.target.removeEventListener(portInitialize);
      evt.target.addEventListener(handler);
      if (evt.data === undefined) {
        reject(new Error("Attempt to open port \"" + channelName + "\" rejected by service worker."));
        return;
      }
      if (evt.data === null) {
        resolve(swChannel.port1);
        return;
      }
      resolve(evt.data);
    }
  });
}
async function createServer(serverPort, origin, handler) {
  return await new Promise((resolve) => {
    serverPort.addEventListener("message", (evt) => {
      if ((evt.data.msg === "serverCreated") && (evt.data.origin === origin)) {
        evt.data.port.addEventListener(handler);
        evt.data.port.start();
        evt.data.port.postMessage(null);
        resolve(evt.data.port);
      }
    });
    serverPort.postMessage({
      cmd: "createServer",
      origin: origin,
    });
  });
}
