// ==UserScript==
// @name         万门大学课程视频批量下载
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  只能批量下载免费的或者已经购买的课程
// @author       none
// @match        https://www.wanmen.org/courses/*
// @grant        none
// ==/UserScript==

// 本文件由 src/index.ts 生成，请修改 src/index.ts 后执行 yarn build 生成，勿直接修改此文件。

"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
function getChapterElements() {
    return document.querySelector("#root > div.course__course-page--3J8Sy > div.course__video-row--20SaE > div.course__playlist-container--17tSE > div.components__container--1fgQp > div > div:nth-child(1) > ul");
}
function checkClientStatus() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let response = yield fetch("http://localhost:5678/status", {
                method: "get",
                mode: "cors",
            });
            if (!response.ok) {
                throw Error(response.statusText);
            }
            return true;
        }
        catch (error) {
            alert("客户端未启动，请启动客户端之后再开始");
            return false;
        }
    });
}
function sleep(ms) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve) => setTimeout(resolve, ms));
    });
}
function waitValue({ predicate, waitInterval, timeout, timeoutRetry, }) {
    return __awaiter(this, void 0, void 0, function* () {
        let value = null;
        let waitTime = 0;
        do {
            value = yield predicate();
            yield sleep(waitInterval);
            waitTime += waitInterval;
            if (typeof timeout !== "undefined" && waitTime >= timeout) {
                timeoutRetry === null || timeoutRetry === void 0 ? void 0 : timeoutRetry();
                waitTime = 0;
            }
        } while (!value);
        return value;
    });
}
function addTask() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!(yield checkClientStatus())) {
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
        for (let chapterElement = cptEles.firstElementChild, cptIdx = 1; chapterElement; chapterElement = chapterElement.nextElementSibling, cptIdx++) {
            const subChapterTitle = chapterElement.querySelector("div");
            if (!subChapterTitle) {
                continue;
            }
            if (subChapterTitle.className.indexOf("presentation") < 0) {
                subChapterTitle.click();
            }
            else {
                continue;
            }
            const subChapters = yield waitValue({
                predicate: () => __awaiter(this, void 0, void 0, function* () { return chapterElement.querySelector("ul"); }),
                waitInterval: 50,
                timeout: 2000,
                timeoutRetry: () => subChapterTitle.click(),
            });
            for (let subCptEle = subChapters.firstElementChild; subCptEle; subCptEle = subCptEle.nextElementSibling) {
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
            let addResponse = yield fetch("http://localhost:5678/add", {
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
        }
        catch (error) {
            alert("已将任务发送到客户端，处理中...");
        }
    });
}
function getM3u8Source() {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        return (_a = document.querySelector("video > source")) === null || _a === void 0 ? void 0 : _a.getAttribute("src");
    });
}
function finishTask() {
    return __awaiter(this, void 0, void 0, function* () {
        const source = yield waitValue({
            predicate: getM3u8Source,
            waitInterval: 100,
        });
        try {
            const m3u8Response = yield fetch(source, {
                method: "get",
            });
            const m3u8Content = yield m3u8Response.text();
            let saveResponse = yield fetch("http://localhost:5678/finish", {
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
        }
        catch (error) {
            console.log(error);
            return;
        }
    });
}
function getTask() {
    return __awaiter(this, void 0, void 0, function* () {
        while (true) {
            try {
                let taskResponse = yield fetch("http://localhost:5678/get", {
                    method: "get",
                    mode: "cors",
                });
                if (!taskResponse.ok) {
                    throw Error(taskResponse.statusText);
                }
                else {
                    const link = yield taskResponse.text();
                    if (link) {
                        document.location.replace(link);
                    }
                }
            }
            catch (error) {
                console.log("未获取到任务：" + error);
            }
            yield sleep(5000);
        }
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        let startBtn = document.createElement("button");
        startBtn.onclick = addTask;
        startBtn.innerText = "添加任务";
        startBtn.setAttribute("style", "position: fixed;top: 50%;left:0;");
        document.body.appendChild(startBtn);
        yield finishTask();
        getTask();
    });
}
main();
