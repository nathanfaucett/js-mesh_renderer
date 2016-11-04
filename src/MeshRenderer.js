var mat3 = require("@nathanfaucett/mat3"),
    mat4 = require("@nathanfaucett/mat4"),
    sceneRenderer = require("@nathanfaucett/scene_renderer");


var Renderer = sceneRenderer.Renderer,
    MeshRendererPrototype;


module.exports = MeshRenderer;


function MeshRenderer() {
    var _this = this;

    Renderer.call(this);

    function renderMesh(mesh) {
        return _this.renderMesh(mesh, renderMesh.camera, renderMesh.webglPlugin);
    }
    renderMesh.set = function(camera, webglPlugin) {
        renderMesh.camera = camera;
        renderMesh.webglPlugin = webglPlugin;
        return renderMesh;
    };

    this._renderMesh = renderMesh;
}
Renderer.extend(MeshRenderer, "mesh_renderer.MeshRenderer", 0);
MeshRendererPrototype = MeshRenderer.prototype;

MeshRendererPrototype.render = function() {
    var sceneRenderer = this.sceneRenderer,
        webglPlugin = sceneRenderer.getPlugin("webgl_plugin.WebGLPlugin"),
        scene = sceneRenderer.scene,
        meshMananger = scene.getComponentManager("mesh.Mesh"),
        camera = scene.getComponentManager("camera.Camera").getActive();

    meshMananger.forEach(this._renderMesh.set(camera, webglPlugin));
};

var modelView = mat4.create(),
    normalMatrix = mat3.create();
MeshRendererPrototype.renderMesh = function(mesh, camera, webglPlugin) {
    var context = webglPlugin.context,
        gl = context.gl,

        entity = mesh.entity,
        transform = entity.getComponent("transform.Transform3D") || entity.getComponents("transform.Transform2D"),

        meshMaterial = mesh.material,
        meshGeometry = mesh.geometry,

        geometry = webglPlugin.getGLGeometry(meshGeometry),
        program = webglPlugin.getGLMaterial(meshMaterial).getProgramFor(meshGeometry),

        indexBuffer;

    transform.calculateModelView(camera.getView(), modelView);
    transform.calculateNormalMatrix(modelView, normalMatrix);

    context.setProgram(program);

    webglPlugin.bindMaterial(meshMaterial);
    webglPlugin.bindUniforms(camera.getProjection(), modelView, normalMatrix, meshMaterial.uniforms, program.uniforms);
    webglPlugin.bindBoneUniforms(mesh.bones, program.uniforms);
    webglPlugin.bindAttributes(geometry.buffers.getObject(), geometry.getVertexBuffer(), program.attributes);

    if (meshMaterial.wireframe !== true) {
        indexBuffer = geometry.getIndexBuffer();
        context.setElementArrayBuffer(indexBuffer);
        gl.drawElements(gl.TRIANGLES, indexBuffer.length, gl.UNSIGNED_SHORT, 0);
    } else {
        indexBuffer = geometry.getLineBuffer();
        context.setElementArrayBuffer(indexBuffer);
        gl.drawElements(gl.LINES, indexBuffer.length, gl.UNSIGNED_SHORT, 0);
    }

    return this;
};