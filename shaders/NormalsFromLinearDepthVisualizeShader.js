NormalsFromLinearDepthVisualizeShader = {

	defines: {
		
	},

	uniforms: {

		"tDepth":       { value: null },
		"uCameraNear":  { value: 0.0 },
		"uCameraFar":   { value: 0.0 },
		"uProjectionMatrixInverse": { value: new THREE.Matrix4() },
		"uSize": { value: new THREE.Vector2() },
	},
	
	

	vertexShader: [
		"attribute vec3 position;",
		"attribute vec2 uv;",
		"varying vec2 vUv;",

		"void main() {",

			"vUv = uv;",
			"gl_Position = vec4( position, 1.0 );",

		"}"

	].join( "\n" ),

	fragmentShader: [
	
		"precision mediump float;",
		
		"uniform float cameraNear;",
		"uniform float cameraFar;",

		"uniform sampler2D tDepth;",
		"uniform vec2 uSize;",

		"const float UnpackDownscale = 255. / 256.; // 0..1 -> fraction (excluding 1)",
		"const vec3 PackFactors = vec3( 256. * 256. * 256., 256. * 256.,  256. );",
		"const vec4 UnpackFactors = UnpackDownscale / vec4( PackFactors, 1. );",
		
		"float unpackRGBAToDepth( const in vec4 v ) {",
		"	return dot( v, UnpackFactors );",
		"}",
		
		
		"varying vec2 vUv;",
		
		//mine:
		"uniform float uCameraNear;",
		"uniform float uCameraFar;",
		"uniform mat4 uProjectionMatrixInverse;",
		
		"vec3 positionViewspace(vec2 uv, float zViewport)",
		"{",
		"	vec3 result =  (uProjectionMatrixInverse * vec4(2.0*uv-1.0, 0.0, 1.0)).xyz;",
		"	result.z = zViewport*(uCameraNear-uCameraFar)-uCameraNear;",
		"	return result;",
		"}",
		
		
		"float depth(const in vec2 uv)",
		"{",
		"	return unpackRGBAToDepth(texture2D( tDepth, uv ));",
		"}",

		"void main() {",
			"float dp = depth(vUv);",
			"if(dp == 1.0)",
			"	discard;",
			"vec2 dx = vec2(1.0/uSize.x, 0.0);",
			"vec2 dy = vec2(0.0, 1.0/uSize.y);",
			"vec3 right = positionViewspace(vUv+dx, depth(vUv+dx));",
			"vec3 left = positionViewspace(vUv-dx, depth(vUv-dx));",
			"vec3 up = positionViewspace(vUv+dy, depth(vUv+dy));",
			"vec3 down = positionViewspace(vUv-dy, depth(vUv-dy));",
			"vec3 n1 = normalize(cross(right-left, up-down));",
			"gl_FragColor = vec4( 0.5*n1+0.5, 1.0 );",

		"}"

	].join( "\n" )

};
