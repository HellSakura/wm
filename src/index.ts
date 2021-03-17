function getChapterElements() {
  return document.querySelector(
    "#root > div.course__course-page--3J8Sy > div.course__video-row--20SaE > div.course__playlist-container--17tSE > div.components__container--1fgQp > div > div:nth-child(1) > ul"
  );
}

async function checkClientStatus() {
  try {
    let response = await fetch("http://localhost:5678/status", {
      method: "get",
      mode: "cors",
    });
    if (!response.ok) {
      throw Error(response.statusText);
    }
    return true;
  } catch (error) {
    alert("客户端未启动，请启动客户端之后再开始");
    return false;
  }
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitValue<T>({
  predicate,
  waitInterval,
  timeout,
  timeoutRetry,
}: {
  predicate: () => Promise<T>;
  waitInterval: number;
  timeout?: number;
  timeoutRetry?: () => void;
}): Promise<Exclude<T, null | undefined>> {
  let value: T | null = null;
  let waitTime = 0;
  do {
    value = await predicate();
    await sleep(waitInterval);
    waitTime += waitInterval;
    if (typeof timeout !== "undefined" && waitTime >= timeout) {
      timeoutRetry?.();
      waitTime = 0;
    }
  } while (!value);
  return value as Exclude<T, null | undefined>;
}

async function addTask() {
  if (!(await checkClientStatus())) {
    return;
  }

  const cptEles = getChapterElements();
  if (!cptEles) {
    alert("未获取到课程列表");
    return;
  }

  const courseName = prompt("请输入课程名称", document.title);
  if (!courseName) {
    alert("课程名称不能为空");
    return;
  }

  const chapters = [];
  for (
    let chapterElement = cptEles.firstElementChild, cptIdx = 1;
    chapterElement;
    chapterElement = chapterElement.nextElementSibling, cptIdx++
  ) {
    const subChapterTitle = chapterElement.querySelector("div");
    if (!subChapterTitle) {
      continue;
    }

    if (subChapterTitle.className.indexOf("presentation") < 0) {
      subChapterTitle.click();
    } else {
      continue;
    }

    const subChapters = await waitValue({
      predicate: async () => chapterElement!.querySelector("ul"),
      waitInterval: 50,
      timeout: 2000,
      timeoutRetry: () => subChapterTitle.click(),
    });

    for (
      let subCptEle = subChapters.firstElementChild;
      subCptEle;
      subCptEle = subCptEle.nextElementSibling
    ) {
      const anchor = subCptEle.querySelector("a");
      if (anchor) {
        chapters.push({
          Link: anchor.href,
          Name: anchor.innerText.split("\n")[0],
        });
      }
    }
    subChapterTitle.click();
  }
  try {
    let addResponse = await fetch("http://localhost:5678/add", {
      method: "post",
      mode: "cors",
      body: JSON.stringify({
        Name: courseName,
        chapters,
      }),
    });
    if (!addResponse.ok) {
      throw new Error(addResponse.statusText);
    }
  } catch (error) {
    alert("已将任务发送到客户端，处理中...");
  }
}

async function getM3u8Source() {
  return document.querySelector("video > source")?.getAttribute("src");
}

async function finishTask() {
  const source = await waitValue({
    predicate: getM3u8Source,
    waitInterval: 100,
  });
  try {
    const m3u8Response = await fetch(source, {
      method: "get",
    });
    const m3u8Content = await m3u8Response.text();
    let saveResponse = await fetch("http://localhost:5678/finish", {
      method: "post",
      mode: "cors",
      body: JSON.stringify({
        Link: document.location.href,
        Content: m3u8Content,
      }),
    });
    if (!saveResponse.ok) {
      throw Error(saveResponse.statusText);
    }
  } catch (error) {
    console.log(error);
    return;
  }
}

async function getTask() {
  while (true) {
    try {
      let taskResponse = await fetch("http://localhost:5678/get", {
        method: "get",
        mode: "cors",
      });
      if (!taskResponse.ok) {
        throw Error(taskResponse.statusText);
      } else {
        const link = await taskResponse.text();
        if (link) {
          document.location.replace(link);
        }
      }
    } catch (error) {
      console.log("未获取到任务：" + error);
    }
    await sleep(5000);
  }
}

async function main() {
  let startBtn = document.createElement("button");
  startBtn.onclick = addTask;
  startBtn.innerText = "添加任务";
  startBtn.setAttribute("style", "position: fixed;top: 50%;left:0;");
  document.body.appendChild(startBtn);

  await finishTask();
  getTask();
}

main();
