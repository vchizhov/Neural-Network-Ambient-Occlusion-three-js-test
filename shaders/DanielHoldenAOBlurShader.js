// adapted from: http://theorangeduck.com/page/neural-network-ambient-occlusion

DanielHoldenAOBlurShader = {

	defines: {
		
	},

	uniforms: {

		"tDepth":       { value: null },
		"tAO":          { value: null },
		"tNormals":     { value: null },
		"tDiffuse":     { value: null },
		"uUseNormalTexture": { value:true },
		"uCombine": 	{ value:true },
		"uSize": 		{ value: new THREE.Vector2() },
		"uCameraNear":  { value: 0.0 },
		"uCameraFar":   { value: 10.0 },
		"uProjectionMatrix": { value: new THREE.Matrix4() },
		"uProjectionMatrixInverse": { value: new THREE.Matrix4() },
		"uScaleDist":	{ value: 0.01 },
		"uScaleNorm":	{ value: 20.0 },
		"uScaleWorld":	{ value: 10.0 },
		
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
		
		"uniform sampler2D tAO;",
		"uniform sampler2D tDepth;",
		"uniform sampler2D tNormals;",
		"uniform sampler2D tDiffuse;",
		"",
		"uniform vec2 uSize;",
		"",
		"uniform float uScaleDist;",
		"uniform float uScaleNorm;",
		"uniform float uScaleWorld;",
		"",
		"uniform float uCameraNear;",
		"uniform float uCameraFar;",
		"",
		"uniform mat4 uProjectionMatrixInverse;",
		"uniform mat4 uProjectionMatrix;",
		"",
		"varying vec2 vUv;",
		"",
		"const float UnpackDownscale = 255. / 256.; // 0..1 -> fraction (excluding 1)",
		"const vec3 PackFactors = vec3( 256. * 256. * 256., 256. * 256.,  256. );",
		"const vec4 UnpackFactors = UnpackDownscale / vec4( PackFactors, 1. );",
		
		"float unpackRGBAToDepth( const in vec4 v ) {",
		"	return dot( v, UnpackFactors );",
		"}",
		
		"float depth(const in vec2 uv)",
		"{",
		"	return unpackRGBAToDepth(texture2D( tDepth, uv ));",
		"}",
		"",
		"vec3 positionViewspace(vec2 uv)",
		"{",
		"	float zEye = depth(uv)*(uCameraNear-uCameraFar)-uCameraNear;",
		"	vec3 result = (uProjectionMatrixInverse * vec4((2.0*uv-1.0)*-zEye, 0.0, 1.0)).xyz;",
		"	result.z = zEye;",
		"	return result;",
		"}",
		
		"uniform bool uUseNormalTexture;",
		"uniform bool uCombine;",
		
		"vec3 getNormal(const in vec2 uv)",
		"{",
			"if(uUseNormalTexture)",
			" return 2.0*texture2D(tNormals, uv).xyz-vec3(1.0);",
			"else{",
			"vec2 dx = vec2(1.0/uSize.x, 0.0);",
			"vec2 dy = vec2(0.0, 1.0/uSize.y);",
			"vec3 right = positionViewspace(vUv+dx);",
			"vec3 left = positionViewspace(vUv-dx);",
			"vec3 up = positionViewspace(vUv+dy);",
			"vec3 down = positionViewspace(vUv-dy);",
			"vec3 n1 = normalize(cross(right-left, up-down));",
			"return n1;}",
		"}",
		
		
		"void main() {",
		"",
		//"  vec2 aTexcoord = vec2(fTexcoord.x, 1.0-fTexcoord.y);",
		"",
		"  float total = 1.0;",
		"  vec4 colour = texture2D(tAO, vUv);",
		"  vec3 normal = getNormal(vUv);",
		"  vec3 world = positionViewspace(vUv);",
		"  ",
		"  for (int x = -3; x <= 3; x++)",
		"  for (int y = -3; y <= 3; y++) {",
		"    vec4 sample_colour = texture2D(tAO,  vUv + (vec2(x,y) / uSize));",
		"    vec3 sample_normal = getNormal(vUv + (vec2(x, y) / uSize));",
		"    vec3 sample_world = positionViewspace(vUv + (vec2(x, y) / uSize));",
		"    vec2 diff_dist = uScaleDist * vec2(x, y);",
		"    vec3 diff_norm = uScaleNorm * (sample_normal.xyz - normal.xyz);",
		"    vec3 diff_wrld = uScaleWorld * (sample_world - world);",
		"    float weight = (",
		"      exp(-(dot(diff_dist, diff_dist))) * ",
		"      exp(-(dot(diff_norm, diff_norm))) * ",
		"      exp(-(dot(diff_wrld, diff_wrld))));",
		"    colour += weight * sample_colour;",
		"    total += weight;",
		"  }",
		"  colour = colour / total;",
		"  ",
		"  gl_FragColor = vec4( uCombine? texture2D(tDiffuse, vUv).xyz * colour.xyz : colour.xyz, 1.0);",
		"} ",

	].join( "\n" )

};

