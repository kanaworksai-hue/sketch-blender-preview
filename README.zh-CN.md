# Sketch Blender Preview

语言： [English](README.md) | [日本語](README.ja.md) | 中文

这是一个纯静态的手绘 Blender 风格 3D playground，可以让访问者在浏览器里预览自己的本地模型。选择或拖入的模型、参考图都只在访问者自己的浏览器中读取，不会上传到服务器。

## 功能

- 通过 `File > Upload` 上传 `.glb` / `.gltf`，也可以直接拖进视口。
- 通过 `Image > Reference` 添加参考图，也可以把图片直接拖进视口。
- 在 normal 渲染和 toon/sketch 蓝色外轮廓渲染之间切换。
- 使用左侧手绘工具移动、旋转、放大缩小模型。
- 使用 Auto Modeling 根据参考图生成简易 proxy 模型，再用 Modeling 切回上传好的模型。
- 打开 Help 查看操作说明，并在英语、日语、中文之间切换 UI 语言。

## 隐私

模型和参考图都是浏览器本地读取。这个 demo 不会把文件上传到服务器。

私有的兔子 `.glb` 模型不会包含在这个公开仓库中。

## 本地运行

```sh
python3 -m http.server 5177
```

然后打开 `http://localhost:5177/`。
