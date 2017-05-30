
DepthVisualizeShader = {
	defines: {
		
	},

	uniforms: {

		"tDepth": { value: null },
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
	
		"uniform sampler2D tDepth;",

		"const float UnpackDownscale = 255. / 256.; // 0..1 -> fraction (excluding 1)",
		"const vec3 PackFactors = vec3( 256. * 256. * 256., 256. * 256.,  256. );",
		"const vec4 UnpackFactors = UnpackDownscale / vec4( PackFactors, 1. );",
		
		"float unpackRGBAToDepth( const in vec4 v ) {",
		"	return dot( v, UnpackFactors );",
		"}",
		
		"varying vec2 vUv;",

		"void main() {",

			"vec4 texel = texture2D( tDepth, vUv );",
			"gl_FragColor = vec4(vec3( unpackRGBAToDepth(texel)), 1.0);",

		"}"

	].join( "\n" )

};
