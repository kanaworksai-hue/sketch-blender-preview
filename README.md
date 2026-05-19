# Sketch Blender Preview

Language: English | [日本語](README.ja.md) | [中文](README.zh-CN.md)

A static, hand-drawn Blender-style 3D playground for local model previews. It runs entirely in the browser, so dropped or selected models and reference images stay on the visitor's machine.

## Features

- Upload a `.glb`, `.gltf`, `.obj`, `.fbx`, or `.stl` from `File > Upload model`, or drop it onto the viewport.
- Add a reference image from `Image > Reference`, or drop an image onto the viewport.
- Switch between normal rendering and the toon/sketch blue-outline style.
- Move, rotate, and scale the model with the hand-drawn toolbar.
- Use Auto Modeling to create a simple proxy model from a reference image, then use Modeling to return to the uploaded model.
- Read the built-in Help panel and cycle the UI language between English, Japanese, and Chinese.

## Privacy

Model and reference uploads are local browser reads. This demo does not upload files to a server.

The private rabbit `.glb` model is intentionally not included in this public repository.

## Run Locally

```sh
python3 -m http.server 5177
```

Open `http://localhost:5177/`.
