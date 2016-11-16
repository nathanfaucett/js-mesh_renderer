var sceneGraph = require("@nathanfaucett/scene_graph"),
    sceneRenderer = require("@nathanfaucett/scene_renderer"),
    cameraComponent = require("@nathanfaucett/camera_component"),
    transformComponents = require("@nathanfaucett/transform_components"),
    meshComponent = require("@nathanfaucett/mesh_component"),
    assets = require("@nathanfaucett/assets"),
    Shader = require("@nathanfaucett/shader"),
    Material = require("@nathanfaucett/material"),
    Geometry = require("@nathanfaucett/geometry"),
    Texture = require("@nathanfaucett/texture"),
    WebGLPlugin = require("@nathanfaucett/webgl_plugin"),
    MeshRenderer = require("..");


var myAssets = assets.Assets.create(),

    Scene = sceneGraph.Scene,
    Entity = sceneGraph.Entity,

    SceneRenderer = sceneRenderer.SceneRenderer,

    Camera = cameraComponent.Camera,
    Mesh = meshComponent.Mesh,
    Transform3D = transformComponents.Transform3D;


var scene = global.scene = Scene.create(),
    camera = Camera.create(),

    shader = Shader.create({
        name: "shader_simple",
        src: null,
        vertex: [
            "varying vec2 vUv;",
            "varying vec3 vNormal;",

            "void main(void) {",
            "   vUv = getUV();",
            "   vNormal = getNormal();",
            "   gl_Position = perspectiveMatrix * modelViewMatrix * getPosition();",
            "}"
        ].join("\n"),
        fragment: [
            "uniform sampler2D texture;",

            "varying vec2 vUv;",
            "varying vec3 vNormal;",

            "void main(void) {",
            "    vec3 light = vec3(1.0, 1.0, 1.0);",
            "    float dprod = max(0.2, dot(vNormal, light));",
            "    gl_FragColor = texture2D(texture, vec2(vUv.s, vUv.t)) * vec4(dprod, dprod, dprod, 1.0);",
            "}"
        ].join("\n")
    }),

    texture = Texture.create({
        name: "texture_crate",
        src: "./crate.png"
    }),

    material = Material.create({
        name: "material_simple",
        src: null,
        shader: shader,
        wireframe: false,
        wireframeLineWidth: 1,
        uniforms: {
            "texture": texture
        }
    }),

    geometry = Geometry.create({name: "geometry", src: "geometry.json"});


myAssets.add(shader, texture, material, geometry);


camera.set(512, 512);


var cameraTransform = Transform3D.create();

cameraTransform.setPosition([0, 10, 5]);
cameraTransform.lookAt([0, 0, 0]);

scene.addEntity(Entity.create().addComponent(cameraTransform, camera));

myAssets.load(function onLoad(error) {
    var meshTransform = Transform3D.create();

    scene.addEntity(
        Entity.create().addComponent(meshTransform, Mesh.create({
            material: material,
            geometry: geometry
        }))
    );

    scene.init();

    var renderer = SceneRenderer.create(scene),
        webglPlugin = WebGLPlugin.create();

    webglPlugin.setCanvas(document.getElementById("canvas"));
    renderer.addPlugin(webglPlugin);
    renderer.addRenderer(new MeshRenderer());

    renderer.init();

    var time = 0;
    (function render() {
        time += scene.time.delta;

        cameraTransform._localPosition[0] = (Math.sin(time) * 10);
        cameraTransform._localPosition[1] = (Math.cos(time) * 10);
        cameraTransform.setNeedsUpdate();

        cameraTransform.lookAt(meshTransform);

        scene.update();
        renderer.render();
        setTimeout(render, 16);
    }());
});
