# 最后一投

无需安装依赖的浏览器篮球投篮游戏。包含球场、球员、篮筐、弹道预览、两分/三分球、60 秒倒计时和重新开始功能。

## 启动

```sh
cd /workspace/basket-ball
python -m http.server 8000 --bind 0.0.0.0
```

浏览器打开服务器地址即可游玩，也可以直接打开 `index.html`。

调整角度与力道后点击投篮；第一球开始计时。空格键投篮，R 键重新开始。时间到后停止计分。虚线是预计路线，球下降穿过篮圈时得分。

## GitHub Pages 发布

此项目是纯静态网站，无需构建。`.nojekyll` 禁用 Jekyll 处理。

在 GitHub 仓库点击 **Settings → Pages**：

1. 在 **Build and deployment → Source** 选择 **Deploy from a branch**。
2. 在 **Branch** 选择 **main**，目录选择 **/ (root)**。
3. 点击 **Save**，等待 GitHub Pages 部署完成。
4. 点击 **Visit site**。预计网站地址：`https://n9wsc66t6v-blip.github.io/basket-ball/`。

之后推送到 `main` 的修改会自动重新发布。如仓库是私有的且账户方案不支持 Pages，需要先使用支持的方案或自行决定是否将仓库公开。
