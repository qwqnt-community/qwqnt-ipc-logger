import superjson from "superjson";

window.superjson = superjson;

const port = location.port;
console.log("通信端口", port);

let filter = "All";
const logMap = new Map([
  ["All", []],
  ["send", []],
  ["receive", []],
  ["other", []],
]);

async function poll() {
  try {
    let logs = superjson.parse(await (await fetch(`http://localhost:${port}/`)).text());

    if (logs && logs.length) {
      for (let i = 0; i < logs.length; i++) {
        const log = logs[i];
        try {
          if (log?.[log.length - 1]?.[0]?.eventName === "LogApi") {
            continue;
          }
          switch (log[0]) {
            case "[send]":
              log[0] = `%c[send]`;
              log.splice(1, 0, "background:#87e8de;color:#000000D9;padding:2px 4px;border-radius: 4px;width:56px;");
              logMap.get("All").push(log);
              logMap.get("send").push(log);
              if (!["send", "All"].includes(filter)) continue;
              break;
            case "[receive]":
              log[0] = `%c[receive]`;
              log.splice(1, 0, "background:#b7eb8f;color:#000000D9;padding:2px 4px;border-radius: 4px;width:56px;");
              logMap.get("All").push(log);
              logMap.get("receive").push(log);
              if (!["receive", "All"].includes(filter)) continue;
              break;
            default:
              log[0] = `%c${log[0]}`;
              log.splice(1, 0, "background:#ffdc00;color:#000000D9;padding:2px 4px;border-radius: 4px;");
              logMap.get("All").push(log);
              logMap.get("other").push(log);
              if (!["other", "All"].includes(filter)) continue;
          }
          console.log(...log);
        } catch (err) {
          console.log("解码出错", err.message, log);
        }
      }
    }
  } catch (err) {
    if (err.message === "Failed to fetch") {
      console.log("=========已断开连接=========");
      return; // 断线后不再轮询
    }
  }
  // 请求完成后立即再次发起
  poll();
}

poll();

function initFilter() {
  // 获取所有同名单选框
  const radios = document.querySelectorAll('input[name="filter"]');
  // 遍历添加监听
  radios.forEach((radio) => {
    radio.addEventListener("change", (event) => {
      if (event.target.checked) {
        console.log("选中了：", event.target.value);
        filter = event.target.value;
        console.clear();
        const filterArr = logMap.get(filter);
        for (let i = 0; i < filterArr.length; i++) {
          console.log(...filterArr[i]);
        }
      }
    });
  });
}

initFilter();

function initCommand() {
  const commandInput = document.querySelector("#command");
  const commandButton = document.querySelector("#sendCommand");
  commandButton.addEventListener("click", () => {
    sendCommand(commandInput.value);
    commandInput.value = "";
  });
  commandInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && event.ctrlKey) {
      sendCommand(commandInput.value);
      commandInput.value = "";
    }
  });
}

function sendCommand(command) {
  fetch(`http://localhost:${port}/command`, {
    method: "POST",
    body: command,
  });
}

document.querySelector("#download").addEventListener("click", () => {
  const a = document.createElement("a");
  const data = superjson.stringify(logMap.get("All"));
  const blob = new Blob([data], { type: "text/plain;charset=utf-8" });
  a.href = URL.createObjectURL(blob);
  a.download = "log.txt";
  a.click();
});

initCommand();
