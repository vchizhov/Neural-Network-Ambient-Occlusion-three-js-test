// adapted from: http://theorangeduck.com/page/neural-network-ambient-occlusion
DanielHoldenNNAOShader = {

	defines: {
		MAX_SAMPLES: 128,
	},

	uniforms: {

		"tDepth":       { value: null },
		"tNormals":     { value: null },
		"tDiffuse":     { value: null },
		//"tRandom": 		{ value: null },
		"uUseNormalTexture": { value:true },
		"uUseScreenCoordRandom": { value:false },
		"uCombine":     { value:true },
		"uSize": 		{ value: new THREE.Vector2() },
		"F0":    		{ value: null },
		"F1":     		{ value: null },
		"F2":     		{ value: null },
		"F3":     		{ value: null },
		"uRadius":      { value: 1.0 },
		"uCameraNear":  { value: 0.0 },
		"uCameraFar":   { value: 10.0 },
		"uProjectionMatrix": { value: new THREE.Matrix4() },
		"uProjectionMatrixInverse": { value: new THREE.Matrix4() },
		"uSamples":		{ value: 8 },
		"Ymean":		{ value: 0.0 },
		"Ystd":			{ value: 0.116180 },
		"Xmean":		{ value: new THREE.Vector4(0.000052, -0.000003, -0.000076,  0.004600) },
		"Xstd":			{ value: new THREE.Vector4(0.047157,  0.052956,  0.030938,  0.056321) },
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
		
		"#define PI 3.14159265359",
		"",
		"/* Full/Half Filter Width */",
		"#define FW 31.0",
		"#define HW ((FW-1.0)/2.0)",
		"",
		"",
		"const vec4 F0a = vec4( 2.364370,  2.399485,  0.889055,  4.055205);",
		"const vec4 F0b = vec4(-1.296360, -0.926747, -0.441784, -3.308158);",
		"const vec4 F1a = vec4( 1.418117,  1.505182,  1.105307,  1.728971);",
		"const vec4 F1b = vec4(-0.491502, -0.789398, -0.328302, -1.141073);",
		"const vec4 F2a = vec4( 1.181042,  1.292263,  2.136337,  1.616358);",
		"const vec4 F2b = vec4(-0.535625, -0.900996, -0.405372, -1.030838);",
		"const vec4 F3a = vec4( 1.317336,  2.012828,  1.945621,  5.841383);",
		"const vec4 F3b = vec4(-0.530946, -1.091267, -1.413035, -3.908190);",
		"",
		"uniform vec4 Xmean; //vec4( 0.000052, -0.000003, -0.000076,  0.004600);",
		"uniform vec4 Xstd; //vec4( 0.047157,  0.052956,  0.030938,  0.056321);",
		"uniform float Ymean;",
		"uniform float Ystd;",
		"",
		"const mat4 W1 = mat4(",
		" -0.147624, -0.150471,  0.154306, -0.006904,",
		"  0.303306,  0.057305, -0.240071,  0.036727,",
		"  0.009158, -0.371759, -0.259837,  0.302215,",
		" -0.111847, -0.183312,  0.044680, -0.190296);",
		"",
		"const mat4 W2 = mat4(",
		"  0.212815,  0.028991,  0.105671, -0.111834,",
		"  0.316173, -0.166099,  0.058121, -0.170316,",
		"  0.135707, -0.478362, -0.156021, -0.413203,",
		" -0.097283,  0.189983,  0.019879, -0.260882);",
		"",
		"const vec4 W3 = vec4( 0.774455,  0.778138, -0.318566, -0.523377);",
		"",
		"const vec4  b0 = vec4( 0.428451,  2.619065,  3.756697,  1.636395);",
		"const vec4  b1 = vec4( 0.566310,  1.877808,  1.316716,  1.091115);",
		"const vec4  b2 = vec4( 0.033848,  0.036487, -1.316707, -1.067260);",
		"const float b3 =  0.151472;",
		"",
		"const vec4  alpha0 = vec4( 0.326746, -0.380245,  0.179183,  0.104307);",
		"const vec4  alpha1 = vec4( 0.255981,  0.009228,  0.211068,  0.110055);",
		"const vec4  alpha2 = vec4(-0.252365,  0.016463, -0.232611,  0.069798);",
		"const float alpha3 = -0.553760;",
		"",
		"const vec4  beta0 = vec4( 0.482399,  0.562806,  0.947146,  0.460560);",
		"const vec4  beta1 = vec4( 0.670060,  1.090481,  0.461880,  0.322837);",
		"const vec4  beta2 = vec4( 0.760696,  1.016398,  1.686991,  1.744554);",
		"const float beta3 =  0.777760;",
		"",
		"",
		"varying vec2 vUv;",
		"",
		"uniform sampler2D tNormals;",
		"uniform sampler2D tDiffuse;",
		"uniform sampler2D tDepth;",
		//"uniform sampler2D tRandom;",
		"uniform sampler2D F0, F1, F2, F3;",
		"",
		"uniform float uRadius;",
		"uniform float uCameraNear;",
		"uniform float uCameraFar;",
		"uniform mat4 uProjectionMatrix;",
		"uniform mat4 uProjectionMatrixInverse;",
		"uniform int uSamples;",
		"",
		"",
		
		"mat4 transpose(in mat4 inMatrix) {",
		"	vec4 i0 = inMatrix[0];",
		"	vec4 i1 = inMatrix[1];",
		"	vec4 i2 = inMatrix[2];",
		"	vec4 i3 = inMatrix[3];",
		"	mat4 outMatrix = mat4(",
		"				 vec4(i0.x, i1.x, i2.x, i3.x),",
		"				 vec4(i0.y, i1.y, i2.y, i3.y),",
		"				 vec4(i0.z, i1.z, i2.z, i3.z),",
		"				 vec4(i0.w, i1.w, i2.w, i3.w)",
		"				 );",
		"	return outMatrix;",
		"}",
		
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
		"uniform bool uUseScreenCoordRandom;",
		"uniform bool uCombine;",
		"uniform vec2 uSize;",
		
		"vec3 getNormal(const in vec2 uv)",
		"{",
			"if(uUseNormalTexture)",
			" return texture2D(tNormals, uv).xyz;",
			"else{",
			"vec2 dx = vec2(1.0/uSize.x, 0.0);",
			"vec2 dy = vec2(0.0, 1.0/uSize.y);",
			"vec3 right = positionViewspace(vUv+dx);",
			"vec3 left = positionViewspace(vUv-dx);",
			"vec3 up = positionViewspace(vUv+dy);",
			"vec3 down = positionViewspace(vUv-dy);",
			"vec3 n1 = normalize(cross(right-left, up-down));",
			"return 0.5*n1+vec3(0.5);}",
		"}",
		
		"",
		
		"vec3 rand(vec3 seed){",
		"  return 2.0*fract(sin(dot(seed, vec3(12.9898, 78.233, 21.317))) * ",
		"  vec3(43758.5453, 21383.21227, 20431.20563))-1.0;",
		"}",
		/*"float rnd(in vec2 uv){",
		"  return unpackRGBAToDepth(texture2D( tRandom, uv ));",
		"}",*/
		"float rand1( const in vec2 uv ) {",
		"	const highp float a = 12.9898, b = 78.233, c = 43758.5453;",
		"	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );",
		"	return fract(sin(sn) * c);",
		"}",
		"",
		"vec4 prelu(vec4 x, vec4 alpha, vec4 beta) {",
		"  return beta * max(x, 0.0) + alpha * min(x, 0.0);",
		"}",
		"",
		"float prelu(float x, float alpha, float beta) {",
		"  return beta * max(x, 0.0) + alpha * min(x, 0.0);",
		"}",
		"",
		"vec2 spiral(float t, float l, float o) {",
		"  return t * vec2(cos(l*2.0*PI*(t+o)), sin(l*2.0*PI*(t+o)));",
		"}",
		"",
		"void main() {",
		"  if(depth(vUv)==1.0) discard;",
		"  vec3 normal = getNormal(vUv);",
		"  vec3 base = positionViewspace(vUv);",
		"  float seed = uUseScreenCoordRandom? rand1(vUv):rand(base).x;",
		"  ",
		"  /* First Layer */",
		"  ",
		"  vec4 H0 = vec4(0.0);",
		"  ",
		"  for (int i = 0; i < MAX_SAMPLES; ++i) {    ",
		"	 if(i==uSamples) break;",
		"    float scale = (PI/4.0) * (FW*FW) * ((float(i+1)/float(uSamples+1))/(0.5*float(uSamples)));",
		"    vec2 indx = spiral(float(i+1)/float(uSamples+1), 2.5, 2.0*PI*seed);",
		"",
		"    vec4 next = uProjectionMatrix * vec4(base + uRadius * (vec3(indx, 0.0)), 1.0);",
		"    vec3 norm = getNormal(((next.xy / next.w)+1.0)/2.0);    ",
		"    vec3 actu = positionViewspace(((next.xy / next.w)+1.0)/2.0);",
		"    vec2 fltr = (indx * HW + HW + 0.5) / (HW*2.0+2.0);",
		"    ",
		"    vec4 X = ",
		"      (1.0 - clamp(length(actu - base) / uRadius, 0.0, 1.0)) * ",
		"      vec4(norm-normal, (actu.z - base.z) / uRadius);    ",
		"    H0 += scale * transpose(mat4(",
		"      texture2D(F0, fltr) * F0a + F0b, texture2D(F1, fltr) * F1a + F1b,",
		"      texture2D(F2, fltr) * F2a + F2b, texture2D(F3, fltr) * F3a + F3b)) * ((X - Xmean) / Xstd);}",
		"  ",
		"  H0 = prelu(H0 + b0, alpha0, beta0);",
		"  ",
		"  /* Other Layers */",
		"  ",
		"  vec4  H1 = prelu(W1 * H0 + b1, alpha1, beta1);",
		"  vec4  H2 = prelu(W2 * H1 + b2, alpha2, beta2);",
		"  float Y  = prelu(dot(W3, H2) + b3, alpha3, beta3);",
		"  ",
		"  /* Output */",
		"  ",
		"  vec3 ao = vec3(1.0)-vec3(clamp(Y * Ystd + Ymean, 0.0, 1.0));",
		"  gl_FragColor = vec4(uCombine? ao*texture2D(tDiffuse, vUv).xyz : ao,1.0);",
		"} ",

	].join( "\n" )

};