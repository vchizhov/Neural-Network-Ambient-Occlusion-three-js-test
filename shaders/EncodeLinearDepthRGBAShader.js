
EncodeLinearDepthRGBAShader = {
	defines: {
	},

	uniforms: {
		"uCameraNear": {value: 0.0},
		"uCameraFar": {value: 0.0},
	},

	vertexShader: [
	
		"uniform mat4 modelViewMatrix;",
		"uniform mat4 projectionMatrix;",
		"attribute vec3 position;",
		"varying float viewSpaceDepth;",

		"void main() {",

			"gl_Position = modelViewMatrix*vec4( position, 1.0 );",
			"viewSpaceDepth = gl_Position.z;",
			" gl_Position= projectionMatrix*gl_Position;",

		"}"

	].join( "\n" ),

	fragmentShader: [
		"precision mediump float;",
		"varying float viewSpaceDepth;",
		"uniform float uCameraNear;",
		"uniform float uCameraFar;",

		"const float PackUpscale = 256. / 255.; // fraction -> 0..1 (including 1)",
		"const vec3 PackFactors = vec3( 256. * 256. * 256., 256. * 256.,  256. );",
		"const float ShiftRight8 = 1. / 256.;",
		
		"vec4 packDepthToRGBA( const in float v ) {",
		"	vec4 r = vec4( fract( v * PackFactors ), v );",
		"	r.yzw -= r.xyz * ShiftRight8; // tidy overflow",
		"	return r * PackUpscale;",
		"}",

		"void main() {",

			"gl_FragColor = packDepthToRGBA( (-viewSpaceDepth-uCameraNear)/(uCameraFar-uCameraNear) );",

		"}"

	].join( "\n" )

};
