// ==UserScript==
// @name         万门大学课程视频批量下载
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  只能批量下载免费的或者已经购买的课程
// @author       cildhdi
// @match        https://www.wanmen.org/courses/*
// @grant        none
// ==/UserScript==

let getCptEles = () => {
    return document.querySelector('#root > div.course__course-page--3J8Sy > div.course__video-row--20SaE > div.course__playlist-container--17tSE > div.components__container--1fgQp > div > div:nth-child(1) > ul');
}

let addTask = async () => {
    try {
        let response = await fetch("http://localhost:5678/status", {
            method: "get",
            mode: "cors"
        });
        if (!response.ok) {
            throw Error(response.statusText);
        }
    } catch (error) {
        alert('客户端未启动，请启动客户端之后再开始');
        return;
    }
    let cptEles = getCptEles();
    let name = "";
    do {
        name = prompt("请输入课程名称");
    } while (!name);
    let chapters = [];
    for (let cptEle = cptEles.firstElementChild, cptIdx = 1; cptEle != undefined; cptEle = cptEle.nextElementSibling, cptIdx++) {
        let subCptTitle = cptEle.querySelector('div');
        if (subCptTitle && subCptTitle.getAttribute('class').indexOf('presentation') < 0) {
            subCptTitle.click();
        } else {
            continue;
        }
        let subCpts = undefined, waitTime = 0;
        while (!(subCpts = cptEle.querySelector('ul'))) {
            const wait = 0.05;
            await new Promise((resolve) => setTimeout(resolve, wait));
            waitTime += wait;
            if (waitTime >= 2) {
                subCptTitle.click();
                waitTime = 0;
            }
        }
        for (let subCptEle = subCpts.firstElementChild, subCptIdx = 1; subCptEle != undefined; subCptEle = subCptEle.nextElementSibling, subCptIdx++) {
            let cptA = subCptEle.querySelector('a');
            chapters.push({
                Link: 'https://www.wanmen.org' + cptA.getAttribute('href'),
                Name: cptA.innerText.split('\n')[0]
            });
        }
        subCptTitle.click();
    }
    try {
        let addResponse = await fetch("http://localhost:5678/add", {
            method: 'post',
            mode: 'cors',
            body: JSON.stringify({
                Name: name,
                chapters
            })
        });
        if (!addResponse.ok) {
            throw new Error(addResponse.statusText);
        }
    } catch (error) {
        alert('已将任务发送到客户端，处理中...');
    }
}

let getSource = async () => {
    let src = document.querySelector('#root > div.course__course-page--3J8Sy > div.course__video-row--20SaE > div:nth-child(1) > div.course__player-container--1S_cH > div > div.VideoWrapper__video-wrapper--3FBpC > video > source');
    if (src) {
        let m3u8 = src.getAttribute('src');
        if (m3u8) {
            return m3u8;
        }
    }
}

let finishTask = async () => {
    while (!(await getSource())) {
        await new Promise((resolve) => setTimeout(resolve, 100));
    }
    let source = await getSource();
    try {
        let m3u8Response = await fetch(source, {
            method: 'get'
        });
        let m3u8Content = await m3u8Response.text();
        let saveResponse = await fetch("http://localhost:5678/finish", {
            method: 'post',
            mode: 'cors',
            body: JSON.stringify({
                Link: document.location.href,
                Content: m3u8Content
            })
        });
        if (!saveResponse.ok) {
            throw Error(saveResponse.statusText);
        }
    } catch (error) {
        console.log(error);
        return;
    }
}

let getTask = async () => {
    while (true) {
        try {
            let taskResponse = await fetch("http://localhost:5678/get", {
                method: 'get',
                mode: 'cors'
            });
            if (!taskResponse.ok) {
                throw Error(taskResponse.statusText);
            } else {
                let link = await taskResponse.text();
                if (link) {
                    let cptEles = getCptEles();
                    for (let cptEle = cptEles.firstElementChild, cptIdx = 1; cptEle != undefined; cptEle = cptEle.nextElementSibling, cptIdx++) {
                        let subCptTitle = cptEle.querySelector('div');
                        if (subCptTitle && subCptTitle.getAttribute('class').indexOf('presentation') < 0) {
                            subCptTitle.click();
                        } else {
                            continue;
                        }
                        let subCpts = undefined, waitTime = 0;
                        while (!(subCpts = cptEle.querySelector('ul'))) {
                            const wait = 10;
                            await new Promise((resolve) => setTimeout(resolve, wait));
                            waitTime += wait;
                            if (waitTime >= 100) {
                                subCptTitle.click();
                                waitTime = 0;
                            }
                        }
                        for (let subCptEle = subCpts.firstElementChild, subCptIdx = 1; subCptEle != undefined; subCptEle = subCptEle.nextElementSibling, subCptIdx++) {
                            let cptA = subCptEle.querySelector('a');
                            if (cptA && link.indexOf(cptA.getAttribute('href')) >= 0) {
                                cptA.click();
                                await new Promise((resolve) => setTimeout(resolve, 2000));
                                await finishTask();
                            }
                        }
                        subCptTitle.click();
                    }
                }
            }
        } catch (error) {
            console.log("未获取到任务：" + error);
        }
        await new Promise((resolve) => setTimeout(resolve, 5000));
    }
}

let main = async () => {
    let startBtn = document.createElement('button');
    startBtn.onclick = addTask;
    startBtn.innerText = '添加任务';
    startBtn.style = "position: fixed;top: 50%;left:0;"
    document.body.appendChild(startBtn);

    await finishTask();
    getTask();
}

main();