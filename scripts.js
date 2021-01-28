var requestOptions = {
  method: "GET",
};

// fetch("https://laptop-81umpbdj.local:34034/privet/info", requestOptions)
//   .then((response) => response.json())
//   .then((result) => console.log(result))
//   .catch((error) => console.log("error", error));

// var hosts = ["test_offline", "laptop-81umpbdj"];
var hosts = ["laptop-81umpbdj"];

console.log("https://" + hosts[0] + ".local:34034/privet/info");

// Todo: if busy it should be not clickable- offline/not connected scanners difference-api terminate
// Todo: when user clicks a scanner- rest scanners should not be polled- api not run- may be keep api run only after user selects
function mdnsOnline(host) {
  var url = "https://" + host + ".local:34034/privet/info";
  fetch(url, requestOptions)
    .then((response) => response.json())
    .then(function (resultObj) {
      // no need since only single scanner attached to host
      console.log(Object.keys(resultObj).length);

      var scannerAppend = document.createElement("button");
      // scannerAppend.id = host;

      scannerAppend.innerHTML = "Name of the Scanner:" + resultObj.name;

      var deviceStatus = document.createElement("span");
      deviceStatus.innerHTML = "Device State:" + resultObj.device_state;
      document.getElementById("selectScanners").appendChild(scannerAppend);

      scannerAppend.onclick = function () {
        scannerSession(host);
      }; // dynamic everything attached to button click?

      document.getElementById("selectScanners").appendChild(deviceStatus);
    })
    // offline scan ners
    .catch((error) => {
      console.log("error", error);

      var offline = document.createElement("span");
      offline.innerHTML =
        "Name of the Host:" + host + "Device State: Not Connected/Offline";
      document.getElementById("offlineScanners").appendChild(offline);
    });
}

function scannersList() {
  hosts.map((host) => mdnsOnline(host));
  document.getElementById("selectButton").disabled = true;
}


function create_UUID() {
  var dt = new Date().getTime();
  var uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (
    c
  ) {
    var r = (dt + Math.random() * 16) % 16 | 0;
    dt = Math.floor(dt / 16);
    return (c == "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
  return uuid;
}

//Todo: Use this as default after creating sessions
function sessionCommands(hst, token, sessionMethod, jsonParams) {
  var url = "https://" + hst + ".local:34034/privet/twaindirect/session";
  var id = create_UUID().toString();
  var data = {
    kind: "twainlocalscanner",
    commandId: id,
    // method: "releaseImageBlocks",
    // params: { sessionId: sessionIdCreate,imageBlockNum:1}
    method: sessionMethod,
    params: jsonParams,
  };
  var dataLength = JSON.stringify(data).length.toString();
  var options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "Content-Length": dataLength,
      "X-Privet-Token": token,
    },
    body: JSON.stringify(data),
  };

  fetch(url, options)
    .then((response) => response.json())
    .then((result) => {
      console.log(result);
      return result;
    });
}

// Todo :  waitfor events capture true not showing need to improve
//also div proper need to add in case of failure
function waitforEvents(rev, hst, sessionIdCreate, token) {
  console.log("running waiting for events");
  var url4 = "https://" + hst + ".local:34034/privet/twaindirect/session";
  var id4 = create_UUID().toString();
  var data4 = {
    kind: "twainlocalscanner",
    commandId: id4,
    method: "waitForEvents",
    params: { sessionId: sessionIdCreate, sessionRevision: rev },
  };
  var data4Length = JSON.stringify(data4).length.toString();
  var options4 = {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "Content-Length": data4Length,
      "X-Privet-Token": token,
    },
    body: JSON.stringify(data4),
  };

  fetch(url4, options4)
    .then((response) => response.json())
    .then((result) => {
      console.log(result);
      console.log("finished waiting for events");
      rev = result.results.events[0].session.revision;
      console.log(rev);
      console.log("capturing ?");
      console.log(result.results.events[0].session.doneCapturing);
      if (result.results.events[0].session.doneCapturing) {
        console.log("capture finished please click stop");
        var element = document.createElement("div");
        element.innerHTML = "done capturing";
        document.getElementById("root").append(element);
        var captureFinished = true;
      } else {
        console.log("waiting for capture to be finished");
        var element = document.createElement("div");
        element.innerHTML = "waiting for capture to be finished";
        document.getElementById("root").append(element);

        waitforEvents(rev, hst, sessionIdCreate, token);
        var captureFinished = false;
      }
      return captureFinished;
    });
}

function scannerSession(hst) {
  document.getElementById("selectButton").disabled = true;
  document.getElementById("closeButton").disabled = false;
  document.getElementById("scanButton").disabled = false;
  document.getElementById("stopButton").disabled = false;

  document.getElementById("root").innerHTML = "";
  var sess = "";
  var token = "";
  console.log("first session", sess);

  document.getElementById("scanButton").onclick = function () {
    var url2 = "https://" + hst + ".local:34034/privet/info";
    var id = create_UUID().toString();
    console.log(id);
    fetch(url2, requestOptions)
      .then((response) => response.json())
      .then(function (resultObj) {
        token = resultObj["x-privet-token"];
        console.log(token);

        var data = {
          kind: "twainlocalscanner",
          commandId: id,
          method: "createSession",
        };
        console.log(data);
        var dataLength = data.toString().length.toString();
        console.log(data.length);
        var options = {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=UTF-8",
            "Content-Length": dataLength,
            "X-Privet-Token": token,
          },
          body: JSON.stringify(data),
        };
        console.log(options);
        fetch(
          "https://"+hosts[0]+".local:34034/privet/twaindirect/session",
          options
        )
          .then((response) => response.json())
          .then((result) => {
            console.log(result.results);

            console.log("capturing start");
            var sessionIdCreate = result.results.session.sessionId.toString();
            sess = sessionIdCreate;
            console.log("first session", sess);

            console.log(sessionIdCreate);
            var url3 =
              "https://" + hst + ".local:34034/privet/twaindirect/session";
            var id3 = create_UUID().toString();
            var data3 = {
              kind: "twainlocalscanner",
              commandId: id3,
              method: "startCapturing",
              params: { sessionId: sessionIdCreate },
            };
            var data3Length = JSON.stringify(data3).length.toString();
            var options3 = {
              method: "POST",
              headers: {
                "Content-Type": "application/json; charset=UTF-8",
                "Content-Length": data3Length,
                "X-Privet-Token": token,
              },
              body: JSON.stringify(data3),
            };

            console.log(options3);
            console.log(url3);
            fetch(url3, options3)
              .then((response) => response.json())
              .then((result) => {
                document.getElementById("scanButton").disabled = true;

                console.log(result);
                // // wait for events capturing true
                var rev = result.results.session.revision;

                document.getElementById("root").innerHTML =
                  "waiting for scanning to complete";
                console.log("running false");

                //     // wait for events capturing true
                // Todo make it wait until it returns true loop while async nature etc
                var captureStatus = waitforEvents(
                  rev,
                  hst,
                  sessionIdCreate,
                  token
                );
                console.log(captureStatus);
              });
          });
      });
  };

  //api here,read images, displays,save button,download local
  document.getElementById("stopButton").onclick = function () {
    document.getElementById("stopButton").disabled = true;
    document.getElementById("root").innerHTML = "";

    var url3 = "https://" + hst + ".local:34034/privet/twaindirect/session";
    var id3 = create_UUID().toString();
    var data3 = {
      kind: "twainlocalscanner",
      commandId: id3,
      method: "stopCapturing",
      params: { sessionId: sess },
    };
    var data3Length = JSON.stringify(data3).length.toString();
    var options3 = {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        "Content-Length": data3Length,
        "X-Privet-Token": token,
      },
      body: JSON.stringify(data3),
    };

    console.log(options3);
    console.log(url3);
    fetch(url3, options3)
      .then((response) => response.json())
      .then((result) => {
        console.log(result.results.session);

        // read image blocks
        // to do add release blocks before closing session
        //To do: check for more image blocks,metadata etc, make it automatic instead of manual stop
        //using wait for events
        //https://stackoverflow.com/questions/52817280/problem-downloading-a-pdf-blob-in-javascript
        var imageDataBlocks = result.results.session.imageBlocks[0];
        // To do write loop array for all image blocks and combine
        console.log(imageDataBlocks);
        var url3 = "https://" + hst + ".local:34034/privet/twaindirect/session";
        var id3 = create_UUID().toString();
        var data3 = {
          kind: "twainlocalscanner",
          commandId: id3,
          method: "readImageBlock",
          params: { sessionId: sess, imageBlockNum: imageDataBlocks },
        };
        var data3Length = JSON.stringify(data3).length.toString();
        var options3 = {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=UTF-8",
            "Content-Length": data3Length,
            "X-Privet-Token": token,
          },
          body: JSON.stringify(data3),
        };

        console.log(options3);
        console.log(url3);
        console.log("reading image blocks");
        fetch(url3, options3)
          .then((response) => response.blob())
          .then((blob) => {
            var blobBuffer = new Blob([blob], { type: "application/pdf" });
            var blobURL = URL.createObjectURL(blobBuffer);
            // window.open(blobURL)

            var iframe = document.createElement("iframe");
            iframe.src = blobURL;
            iframe.width = 800;
            iframe.height = 650;
            // iframe.setAttribute("style","height:900", "width:600");
            document.getElementById("root").appendChild(iframe);

            // To do: Download with custom save name can be added instead of default browser view
            // var link = document.createElement('a');
            // link.appendChild(document.createTextNode("Click me to download"))
            // link.href=URL.createObjectURL(blob)
            // link.download="myFile.pdf";
            // document.getElementById("root").appendChild(link)

            // window.open(URL.createObjectURL(blob))

            //release after reading-storing
            var methodRelease = "releaseImageBlocks";
            var releaseParams = {
              sessionId: sess,
              imageBlockNum: 1,
              lastImageBlockNum: 1,
            };
            console.log("released");
            sessionCommands(hst, token, methodRelease, releaseParams);
          });
      });
  };

  document.getElementById("closeButton").onclick = function () {
    document.getElementById("root").innerHTML = "";
    var urlClose = "https://" + hst + ".local:34034/privet/twaindirect/session";
    console.log("check here", sess);
    console.log("token", token);
    var sessionIdClose = sess;
    var idClose = create_UUID().toString();
    var data3 = {
      kind: "twainlocalscanner",
      commandId: idClose,
      method: "closeSession",
      params: { sessionId: sessionIdClose },
    };
    var data3Length = JSON.stringify(data3).length.toString();
    var optionsClose = {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        "Content-Length": data3Length,
        "X-Privet-Token": token,
      },
      body: JSON.stringify(data3),
    };

    console.log(optionsClose);
    console.log(urlClose);
    fetch(urlClose, optionsClose).then((response) => console.log(response));

    document.getElementById("selectButton").disabled = false;
    document.getElementById("closeButton").disabled = true;
    document.getElementById("scanButton").disabled = true;
    document.getElementById("stopButton").disabled = true;
    var selectLoop = document.createElement("div");
    selectLoop.id = "selectScanners";
    var offlineLoop = document.createElement("div");
    offlineLoop.id = "offlineScanners";
    document.getElementById("root").appendChild(selectLoop);
    document.getElementById("root").appendChild(offlineLoop);
  };
}

