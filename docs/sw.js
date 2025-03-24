/*
(c) 2025 Scot Watson  All Rights Reserved
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

const NamedPorts = import("https://scotwatson.github.io/WebCommon/namedPorts@20250324.mjs");

const serverPorts = new Map();
const origins = new Map();
const wellKnownPorts = new Map();
wellKnownPorts.set("http", 80);
wellKnownPorts.set("https", 443);

self.addEventListener("install", (evt) => {
  console.log("sw.js installed");
});

self.addEventListener("activate", (evt) => {
  self.clients.claim();
  console.log("sw.js activated");
});

self.addEventListener("fetch", (evt) => {
  const requestUrl = new URL(evt.request.url);
  const requestOrigin = requestUrl.origin;
  const requestProtocol = requestUrl.protocol;
  const requestPort = requestUrl.port === "" ? wellKnownPorts.get(requestUrl.protocol) : requestUrl.port;
  const handler = () => {
    const thisOrigin = origins.get(requestOrigin);
    if (!thisOrigin) {
      return fetch;
    }
    return requestHandlerFactory(thisOrigin.requestPort);
  };
  evt.respondWith(handler(evt.request));
});

function requestHandlerFactory(requestPort) {
  return async (request) => {
    try {
      const requestUrl = new URL(request);
      const headers = Array.from(request.headers);
      const blobContent = await request.blob();
      headers.push([ "Content-type", blobContent.type ]);
      headers.push([ "User-Agent", self.navigator.userAgent ]);
      const dataContent = await blobContent.arrayBuffer();
      const transferableRequest = {
        port: requestUrl.port,
        protocol: requestUrl.protocol,
        path: requestUrl.pathname,
        method: request.method,
        headers,
        body: dataContent,
      };
      const thisResponse = await new Promise((resolve) => {
        const id = crypto.randomUUID();
        requestPort.addEventListener("message", handleResponse);
        requestPort.postMessage({
          requestId: id,
          request: request,
        });
        function handleResponse(evt) {
          requestPort.removeEventListener("message", handleResponse);
          if ((typeof evt.data === "object") && (evt.data !== null)) {
            if (evt.data.responseId === id) {
              resolve(new Response(evt.data.body, {
                status: evt.data.status,
                statusText: evt.data.statusText,
                headers: evt.data.headers,
              }));
            }
          }
        }
      });
    } catch (error) {
      return new Response(error.toString(), {
        status: 500,
        statusText: "Internal Server Error",
      });
    }
  };
}

async function httpHandler(request) {
  const resource = resources.get(evt.request.url);
  if (resource) {
    return new Response(resource);
  } else {
  }

}

function serverPortHandler(evt) {
  switch (typeof evt.data) {
    case "object":
      if (evt.data !== null && typeof evt.data.cmd === "string") {
        switch (evt.data.cmd) {
          case "createOrigin":
            createOrigin(evt.data);
            break;
          default:
            evt.target.postMessage({
              error: "Unrecognized Command Received",
            });
        }
      }
      break;
    case "undefined":
      serverPorts.remove();
    default:
      // Unrecognized command
  }
  function createOrigin(data) {
    const worker = new Worker(data.src);
    const configPortOpen = openPort(worker, "config");
    const requestPortOpen = openPort(worker, "request");
    const [ configPort, requestPort ] = await Promise.all([ configPortOpen, requestPortOpen ]);
    origins.set(data.origin, {
      worker,
      requestPort,
    });
    evt.target.postMessage({
      msg: "originData",
      origin: data.url,
      configPort,
    }, [ configPort ]);
  }
}

NamedPorts.addNamedChannel("server", serverPortHandler, false);
