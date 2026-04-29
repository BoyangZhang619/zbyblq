<!-- markdownlint-disable -->
# WebPage Playground

个人静态网页合集。根目录的 `index.html` 是导航主页，提供深/浅色切换；每个子目录是一份独立的小项目或工具。

## 在线体验
- 导航主页：https://zbyblq.xin
- Piano Keys：/playPiano/
- 二叉树可视化：/btree/
- 图片混淆工具：/encryptionGraph/
- 英文字体转换：/eft/
- 小游戏合集：https://zbyblq.xin/Little_game_of_webpage/
- 新春祝福生成：https://zbyblq.xin/happyDays/（生成文字需要联网）
- 生日页：/birthday/（current status is inactive）

## 功能亮点
- 导航主页
  - 读取 `mainpage/data/navItems.json` 渲染卡片，按状态排序，支持标签/徽章。
  - 主题配置来自 `mainpage/data/theme.json`（颜色、字重、间距），主题保存到 localStorage，未选择时跟随系统。
  - 深/浅色切换与自定义光标脚本联动。
- Piano Keys
  - 基于 Web Audio 的键盘，支持鼠标点击或键盘映射演奏，范围 C2–C7。
  - 内置三角波/正弦波/方波/锯齿波音色，预设曲谱播放，全屏提示与横屏提示。
- 二叉树可视化
  - 接受层序输入生成树形图，支持导出图片。
- 图片混淆
  - 使用空间填充曲线对图片进行混淆/还原，保持色彩，可配置步骤并预览。
- 英文字体转换
  - 将英文文本一键转换为多种 Unicode 字体样式。
- 其他
  - 小游戏外链（2048、华容道、迷宫、扫雷等）和个人生日页。

## 本地运行
1) 克隆仓库：`git clone <repo-url> && cd webPage`
2) 启动静态服务（让 fetch 能读取本地 JSON）：
   - Python：`python -m http.server 8000`
   - 或 Node：`npx serve .`
3) 打开 `http://localhost:8000/` 访问导航主页；也可以直接打开任意子目录的 `index.html`。

## 项目结构
```
index.html
mainpage/         # 导航页样式、脚本、数据
playPiano/        # Web Audio 钢琴
btree/            # 二叉树可视化
encryptionGraph/  # 图片混淆工具
eft/              # 英文字体转换
birthday/         # 生日页
imageContent/     # 图标与共享素材
timecount/, codeContent/, touxiang/ ... # 其他静态页/素材
```

## 维护提示
- 更新导航卡片：`mainpage/data/navItems.json`
- 调整主题变量：`mainpage/data/theme.json`
- 核心导航脚本：`mainpage/js/main.js`, `mainpage/js/fullScreen.js`, `mainpage/js/cursor.js`
- 编码：保持 UTF-8；如果中文显示异常，检查编辑器和响应头的 UTF-8 设置。
