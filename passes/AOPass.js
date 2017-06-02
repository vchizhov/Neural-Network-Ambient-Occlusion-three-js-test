AOPass = function(params)
{
	this.params = params;
	// create the buffers we will need
	var pars = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, stencilBuffer: false };
	this.depthRenderTarget = new THREE.WebGLRenderTarget( window.innerWidth*this.params.widthMultiplier, window.innerHeight*this.params.heightMultiplier, pars );
	// we may not need this - just comment it if you don't need it
	this.normalsRenderTarget = new THREE.WebGLRenderTarget( window.innerWidth*this.params.widthMultiplier, window.innerHeight*this.params.heightMultiplier, pars );
	this.diffuseRenderTarget = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight, pars );
	this.aoRenderTarget = new THREE.WebGLRenderTarget( window.innerWidth*this.params.widthMultiplier, window.innerHeight*this.params.heightMultiplier, pars );
	
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
	//DANIEL HOLDEN NNAO SHADER
	////////////////////////////////////////////////////////////////////////////////////////////
	shader = DanielHoldenNNAOShader;
	this.danielHoldenNNAOMaterial = new THREE.RawShaderMaterial({
    	defines: shader.defines,
		uniforms: THREE.UniformsUtils.clone( shader.uniforms ),
		vertexShader: shader.vertexShader,
		fragmentShader: shader.fragmentShader
	});
	material = this.danielHoldenNNAOMaterial;
	material.depthTest = false;
	material.uniforms.tDepth.value = this.depthRenderTarget.texture;
	material.uniforms.tNormals.value = this.normalsRenderTarget.texture;
	material.uniforms.tDiffuse.value = this.diffuseRenderTarget.texture;
	//this.depthRenderTarget.texture.wrapS = THREE.MirroredRepeatWrapping;
	//this.depthRenderTarget.texture.wrapT = THREE.MirroredRepeatWrapping;
	//material.uniforms.tRandom.value = this.CPUTexture;
	material.uniforms.F0.value = F0;
	material.uniforms.F1.value = F1;
	material.uniforms.F2.value = F2;
	material.uniforms.F3.value = F3;
	
	////////////////////////////////////////////////////////////////////////////////////////////
	//DANIEL HOLDEN AO BLUR SHADER
	////////////////////////////////////////////////////////////////////////////////////////////
	shader = DanielHoldenAOBlurShader;
	this.danielHoldenAOBlurMaterial = new THREE.RawShaderMaterial({
    	defines: shader.defines,
		uniforms: THREE.UniformsUtils.clone( shader.uniforms ),
		vertexShader: shader.vertexShader,
		fragmentShader: shader.fragmentShader
	});
	material = this.danielHoldenAOBlurMaterial;
	material.depthTest = false;
	material.uniforms.tDepth.value = this.depthRenderTarget.texture;
	material.uniforms.tNormals.value = this.normalsRenderTarget.texture;
	material.uniforms.tAO.value = this.aoRenderTarget.texture;
	material.uniforms.tDiffuse.value = this.diffuseRenderTarget.texture;
}

AOPass.prototype.resize = function()
{
	this.depthRenderTarget.setSize(window.innerWidth*this.params.widthMultiplier, window.innerHeight*this.params.heightMultiplier);
	this.normalsRenderTarget.setSize(window.innerWidth*this.params.widthMultiplier, window.innerHeight*this.params.heightMultiplier);
	this.aoRenderTarget.setSize(window.innerWidth*this.params.widthMultiplier, window.innerHeight*this.params.heightMultiplier);
	var material = undefined;
	
	material = this.normalsFromLinearDepthVisualizeMaterial;
	material.uniforms.uSize.value.set( this.depthRenderTarget.width, this.depthRenderTarget.height );
	
	material = this.danielHoldenNNAOMaterial;
	material.uniforms.uSize.value.set( this.depthRenderTarget.width, this.depthRenderTarget.height );
	
	material = this.danielHoldenAOBlurMaterial;
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
	
	////////////////////////////////////////////////////////////////////////////////////////////
	//DANIEL HOLDEN NNAO SHADER
	////////////////////////////////////////////////////////////////////////////////////////////
	material = this.danielHoldenNNAOMaterial;
	material.uniforms.uCameraNear.value = camera.near;
	material.uniforms.uCameraFar.value = camera.far;
	material.uniforms.uProjectionMatrix.value = camera.projectionMatrix;
	material.uniforms.uProjectionMatrixInverse.value.getInverse( camera.projectionMatrix );
	
	////////////////////////////////////////////////////////////////////////////////////////////
	//DANIEL HOLDEN AO BLUR SHADER
	////////////////////////////////////////////////////////////////////////////////////////////
	material = this.danielHoldenAOBlurMaterial;
	material.uniforms.uCameraNear.value = camera.near;
	material.uniforms.uCameraFar.value = camera.far;
	material.uniforms.uProjectionMatrix.value = camera.projectionMatrix;
	material.uniforms.uProjectionMatrixInverse.value.getInverse( camera.projectionMatrix );
}

AOPass.prototype.updateParameters = function()
{
	////////////////////////////////////////////////////////////////////////////////////////////
	//DANIEL HOLDEN NNAO SHADER
	////////////////////////////////////////////////////////////////////////////////////////////
	material = this.danielHoldenNNAOMaterial;
	material.uniforms.uRadius.value = this.params.radius;
	material.uniforms.Ymean.value = this.params.ymean;
	material.uniforms.Ystd.value = this.params.ystd;
	material.uniforms.Xmean.value.set(this.params.xmean0, this.params.xmean1, this.params.xmean2, this.params.xmean3);
	material.uniforms.Xstd.value.set(this.params.xstd0, this.params.xstd1, this.params.xstd2, this.params.xstd3);
	material.uniforms.uSamples.value = this.params.samples;
	material.uniforms.uUseNormalTexture.value = this.params.useNormalTexture;
	material.uniforms.uUseScreenCoordRandom.value = this.params.useScreenCoordRandom;
	material.uniforms.uCombine.value = this.params.combine;
	
	////////////////////////////////////////////////////////////////////////////////////////////
	//DANIEL HOLDEN AO BLUR SHADER
	////////////////////////////////////////////////////////////////////////////////////////////
	material = this.danielHoldenAOBlurMaterial;
	material.uniforms.uScaleDist.value = this.params.scaleDist;
	material.uniforms.uScaleNorm.value = this.params.scaleNorm;
	material.uniforms.uScaleWorld.value = this.params.scaleWorld;
	material.uniforms.uUseNormalTexture.value = this.params.useNormalTexture;
	material.uniforms.uCombine.value = this.params.combine;
	material.uniforms.uScaleDist.value = this.params.scaleDist;
	material.uniforms.uScaleNorm.value = this.params.scaleNorm;
	material.uniforms.uScaleWorld.value = this.params.scaleWorld;
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
		if(this.danielHoldenNNAOMaterial.uniforms.uUseNormalTexture.value)
		{
			scene.overrideMaterial = this.normalsEncodeMaterial;
			renderer.setClearColor( 0x000000 );
			renderer.render(scene, camera, this.normalsRenderTarget, true);
		}
		scene.overrideMaterial = null;
		
		this.postPassScene.overrideMaterial = this.danielHoldenNNAOMaterial;
		renderer.setClearColor( 0x000000 );
		if(this.params.combine)
		{
			renderer.render(scene, camera, this.diffuseRenderTarget);
		}
		if(this.params.blur)
		{
			renderer.render(this.postPassScene, this.postPassCamera, this.aoRenderTarget, true);
			this.postPassScene.overrideMaterial = this.danielHoldenAOBlurMaterial;
		}
		renderer.render(this.postPassScene, this.postPassCamera, null, true);
		break;
	}
	default:
	{
		renderer.render(scene, camera);
	}
	}
}
