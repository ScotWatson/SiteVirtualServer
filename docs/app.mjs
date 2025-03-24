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
  const thisPort = await Main.openPort(navigator.serviceWorker.controller, channelName);
  thisPort.addEventListener(handler);
  return thisPort;
}
async function createServer(serverPort, origin, handler) {
  return await new Promise((resolve) => {
    serverPort.addEventListener("message", (evt) => {
      if ((evt.data.msg === "originCreated") && (evt.data.origin === origin)) {
        evt.data.port.addEventListener(handler);
        evt.data.port.start();
        evt.data.port.postMessage(null);
        resolve(evt.data.port);
      }
    });
    serverPort.postMessage({
      cmd: "createOrigin",
      origin: origin,
      src: "server.js",
    });
  });
}
