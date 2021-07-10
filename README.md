# 万门大学课程视频批量下载

只能批量下载免费的或者已经购买的课程，需要配合本地客户端使用。

## 使用步骤

### 下载

本仓库 Release 页面中提供 Windows 平台可执行文件的下载。

> 也可以自行编译，在任意操作系统安装 Go 和 Yarn 后执行 ``` ./build.sh ``` 在 dist 文件夹得到可执行文件与 index.js 脚本文件。

### 安装

- 浏览器安装 Tampermonkey 插件
- Tampermonkey 添加脚本，贴入 `dist/index.js` 的内容
- 或者在greasyfork安装 [直达](https://greasyfork.org/zh-CN/scripts/423408-%E4%B8%87%E9%97%A8%E5%A4%A7%E5%AD%A6%E8%AF%BE%E7%A8%8B%E8%A7%86%E9%A2%91%E6%89%B9%E9%87%8F%E4%B8%8B%E8%BD%BD)

### 运行

#### 添加课程任务

运行上述可执行文件，输入 `1` 进入添加任务模式，然后在浏览器打开要下载的课程的任一章节播放页面，课程页面右侧章节列表加载完毕后点击左边添加课程按钮，输入课程名称（后续会以此名称在wm同级download文件夹内新建文件夹）并确定，在 wm 控制台会显示相关信息请关注。可以重复以上操作添加多个课程，一个课程只需要添加一次，成功之后可以关闭 wm。

#### 开始下载 m3u8 文件
再次运行上述可执行文件，输入 `2` 进入分发任务模式，浏览器打开任意多的万门课程播放标签页后自动开始刷新下载（如果进入后没有自动开始播放请手动点击一下列表中的任一课程让播放器开始播放，后面会自动刷新）。在 wm 控制台会显示相关信息请关注，下载完毕之后，下载的 m3u8 文件会按照输入的课程名称文件夹分类存放在 download 内。

#### 下载视频
使用 [m3u8批量下载](https://nilaoda.github.io/N_m3u8DL-CLI/SimpleGUI.html) 工具，将 download 文件夹内的课程名文件夹拖放到下载工具的M3U8地址文本框，BASEURL填入

```
https://media.wanmen.org/
```

在下载器的请求头中填入

```
Referer:https://www.wanmen.org/courses/
```
点击 Go 开始下载。

![image](https://raw.githubusercontent.com/HellSakura/wm/master/images/m3u8.PNG)

### TIP
- 反馈请走[这里](https://github.com/HellSakura/wm/issues)提交 issue
- 有关标签页的数量，一个标签页刷新一次即获取到一个视频链接，理论上打开越多获取越快，但刷新速度受网速以及设备性能的限制，请根据实际情况自行调整打开数量。
- wm同级目录下的 wm.db 保存了课程任务信息，在退出后再次进入分发任务模式，可以自动开始上次未完成的任务。
- 课程播放页面的布局可能发生变化，具体表现为模式1下无法添加课程，模式2下页面不会自动刷新，可以直接提交 issue (其他问题也可以)。
- m3u8批量下载工具 [Release](https://github.com/nilaoda/N_m3u8DL-CLI/releases) 地址
