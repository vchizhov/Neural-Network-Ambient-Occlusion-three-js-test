AOPass = function(params)
{
	this.params = params;
	// create the buffers we will need
	var pars = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, stencilBuffer: false };
	this.depthRenderTarget = new THREE.WebGLRenderTarget( window.innerWidth*this.params.widthMultiplier, window.innerHeight*this.params.heightMultiplier, pars );
	// we may not need this - just comment it if you don't need it
	this.normalsRenderTarget = new THREE.WebGLRenderTarget( window.innerWidth*this.params.widthMultiplier, window.innerHeight*this.params.heightMultiplier, pars );
	this.diffuseRenderTarget = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight, pars );
	
	// textures for the shader
	var loader = new THREE.TGALoader();
	var F0 = loader.load( 'textures/nnao_f0.tga' );
	var F1 = loader.load( 'textures/nnao_f1.tga' );
	var F2 = loader.load( 'textures/nnao_f2.tga' );
	var F3 = loader.load( 'textures/nnao_f3.tga' );
	
	// used for the postprocessing pass
	this.postPassScene = new THREE.Scene();
	this.postPassCamera = new THREE.OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );
	this.postPassQuad = new THREE.Mesh( new THREE.PlaneBufferGeometry( 2, 2 ), this.depthVisualizeMaterial );
	this.postPassQuad.frustumCulled = false; // Avoid getting clipped
	this.postPassScene.add( this.postPassQuad );
	
	
	var shader = undefined;
	var material = undefined;
	
	////////////////////////////////////////////////////////////////////////////////////////////
	//LINEAR DEPTH RGBA ENCODE
	////////////////////////////////////////////////////////////////////////////////////////////
	shader = EncodeLinearDepthRGBAShader;
	this.linearDepthRGBAEncodeMaterial = new THREE.RawShaderMaterial({
		defines: shader.defines,
		uniforms: THREE.UniformsUtils.clone( shader.uniforms ),
		vertexShader: shader.vertexShader,
		fragmentShader: shader.fragmentShader
	});
		
	////////////////////////////////////////////////////////////////////////////////////////////
	// NORMALS RGB ENCODE
	////////////////////////////////////////////////////////////////////////////////////////////
	shader = EncodeNormalsShader;
	this.normalsEncodeMaterial = new THREE.RawShaderMaterial({
		defines: shader.defines,
		uniforms: THREE.UniformsUtils.clone( shader.uniforms ),
		vertexShader: shader.vertexShader,
		fragmentShader: shader.fragmentShader
	});
	
	////////////////////////////////////////////////////////////////////////////////////////////
	// NORMALS RGB ENCODE + LINEAR DEPTH A ENCODE
	////////////////////////////////////////////////////////////////////////////////////////////
	//...tbd
	
	
	////////////////////////////////////////////////////////////////////////////////////////////
	//DEPTH VISUALIZE
	////////////////////////////////////////////////////////////////////////////////////////////
	shader = DepthVisualizeShader;
	this.depthVisualizeMaterial = new THREE.RawShaderMaterial({
    	defines: shader.defines,
		uniforms: THREE.UniformsUtils.clone( shader.uniforms ),
		vertexShader: shader.vertexShader,
		fragmentShader: shader.fragmentShader
	});
	material = this.depthVisualizeMaterial;
	material.depthTest = false;
	material.uniforms.tDepth.value = this.depthRenderTarget.texture;
	
	////////////////////////////////////////////////////////////////////////////////////////////
	//TEXTURE VISUALIZE
	////////////////////////////////////////////////////////////////////////////////////////////
	shader = TextureVisualizeShader;
	this.textureVisualizeMaterial = new THREE.RawShaderMaterial({
    	defines: shader.defines,
		uniforms: THREE.UniformsUtils.clone( shader.uniforms ),
		vertexShader: shader.vertexShader,
		fragmentShader: shader.fragmentShader
	});
	material = this.textureVisualizeMaterial;
	material.depthTest = false;
	material.uniforms.tTexture.value = this.normalsRenderTarget.texture;
	
	////////////////////////////////////////////////////////////////////////////////////////////
	//NORMALS FROM LINEAR DEPTH VISUALIZE
	////////////////////////////////////////////////////////////////////////////////////////////
	shader = NormalsFromLinearDepthVisualizeShader;
	this.normalsFromLinearDepthVisualizeMaterial = new THREE.RawShaderMaterial({
    	defines: shader.defines,
		uniforms: THREE.UniformsUtils.clone( shader.uniforms ),
		vertexShader: shader.vertexShader,
		fragmentShader: shader.fragmentShader
	});
	material = this.normalsFromLinearDepthVisualizeMaterial;
	material.depthTest = false;
	material.uniforms.tDepth.value = this.depthRenderTarget.texture;
	material.uniforms.uSize.value.set( this.depthRenderTarget.width, this.depthRenderTarget.height );
	
	////////////////////////////////////////////////////////////////////////////////////////////
	//DANIEL HOLDEN SAO SHADER
	////////////////////////////////////////////////////////////////////////////////////////////
	shader = DanielHoldenSAOShader;
	this.danielHoldenSAOMaterial = new THREE.RawShaderMaterial({
    	defines: shader.defines,
		uniforms: THREE.UniformsUtils.clone( shader.uniforms ),
		vertexShader: shader.vertexShader,
		fragmentShader: shader.fragmentShader
	});
	material = this.danielHoldenSAOMaterial;
	material.depthTest = false;
	material.uniforms.tDepth.value = this.depthRenderTarget.texture;
	material.uniforms.tNormals.value = this.normalsRenderTarget.texture;
	material.uniforms.F0.value = F0;
	material.uniforms.F1.value = F1;
	material.uniforms.F2.value = F2;
	material.uniforms.F3.value = F3;
}

AOPass.prototype.resize = function()
{
	this.depthRenderTarget.setSize(window.innerWidth*this.params.widthMultiplier, window.innerHeight*this.params.heightMultiplier);
	this.normalsRenderTarget.setSize(window.innerWidth*this.params.widthMultiplier, window.innerHeight*this.params.heightMultiplier);
	var material = undefined;
	
	material = this.normalsFromLinearDepthVisualizeMaterial;
	material.uniforms.uSize.value.set( this.depthRenderTarget.width, this.depthRenderTarget.height );
	
	material = this.danielHoldenSAOMaterial;
	material.uniforms.uSize.value.set( this.depthRenderTarget.width, this.depthRenderTarget.height );
}

AOPass.prototype.updateCamera = function(camera)
{
	var material = undefined;
	
	////////////////////////////////////////////////////////////////////////////////////////////
	//LINEAR DEPTH RGBA ENCODE
	////////////////////////////////////////////////////////////////////////////////////////////
	material = this.linearDepthRGBAEncodeMaterial;
	material.uniforms.uCameraNear.value = camera.near;
	material.uniforms.uCameraFar.value = camera.far;
	
	////////////////////////////////////////////////////////////////////////////////////////////
	//NORMALS FROM LINEAR DEPTH VISUALIZE
	////////////////////////////////////////////////////////////////////////////////////////////
	material = this.normalsFromLinearDepthVisualizeMaterial;
	material.uniforms.uCameraNear.value = camera.near;
	material.uniforms.uCameraFar.value = camera.far;
	material.uniforms.uProjectionMatrixInverse.value.getInverse( camera.projectionMatrix );
	
	material = this.danielHoldenSAOMaterial;
	material.uniforms.uCameraNear.value = camera.near;
	material.uniforms.uCameraFar.value = camera.far;
	material.uniforms.uProjectionMatrix.value = camera.projectionMatrix;
	material.uniforms.uProjectionMatrixInverse.value.getInverse( camera.projectionMatrix );
}

AOPass.prototype.updateParameters = function()
{
	material = this.danielHoldenSAOMaterial;
	material.uniforms.uRadius.value = this.params.radius;
	material.uniforms.Ymean.value = this.params.ymean;
	material.uniforms.Ystd.value = this.params.ystd;
	material.uniforms.uSamples.value = this.params.samples;
	material.uniforms.uNormalTexture.value = this.params.useNormalTexture;
}

//renderMode = "Default"/"LinearDepth"/"Normals"/"NormalsFromLinearDepth"/"DanielHoldenSAO"
AOPass.prototype.render = function(renderer, camera, scene, renderMode)
{
	switch(renderMode)
	{
	case "LinearDepth":
	{
		scene.overrideMaterial = this.linearDepthRGBAEncodeMaterial;
		renderer.setClearColor( 0xffffff );
		renderer.render(scene, camera, this.depthRenderTarget, true);
		scene.overrideMaterial = null;
		this.postPassScene.overrideMaterial = this.depthVisualizeMaterial;
		renderer.render(this.postPassScene, this.postPassCamera, null, true);
		break;
	}
	case "Normals":
	{
		scene.overrideMaterial = this.normalsEncodeMaterial;
		renderer.setClearColor( 0x000000 );
		renderer.render(scene, camera, this.normalsRenderTarget, true);
		scene.overrideMaterial = null;
		this.postPassScene.overrideMaterial = this.textureVisualizeMaterial ;
		renderer.render(this.postPassScene, this.postPassCamera, null, true);
		break;
	}
	case "NormalsFromLinearDepth":
	{
		scene.overrideMaterial = this.linearDepthRGBAEncodeMaterial;
		renderer.setClearColor( 0xffffff );
		renderer.render(scene, camera, this.depthRenderTarget, true);
		scene.overrideMaterial = null;
		this.postPassScene.overrideMaterial = this.normalsFromLinearDepthVisualizeMaterial;
		renderer.setClearColor( 0x000000 );
		renderer.render(this.postPassScene, this.postPassCamera, null, true);
		break;
	}
	case "DanielHoldenSAO":
	{
		// depth encode
		scene.overrideMaterial = this.linearDepthRGBAEncodeMaterial;
		renderer.setClearColor( 0xffffff );
		renderer.render(scene, camera, this.depthRenderTarget, true);
		// normals encode
		if(this.danielHoldenSAOMaterial.uniforms.uNormalTexture.value)
		{
			scene.overrideMaterial = this.normalsEncodeMaterial;
			renderer.setClearColor( 0x000000 );
			renderer.render(scene, camera, this.normalsRenderTarget, true);
		}
		scene.overrideMaterial = null;
		
		this.postPassScene.overrideMaterial = this.danielHoldenSAOMaterial;
		renderer.setClearColor( 0x000000 );
		renderer.render(this.postPassScene, this.postPassCamera, null, true);
		break;
	}
	default:
	{
		renderer.render(scene, camera);
	}
	}
}
