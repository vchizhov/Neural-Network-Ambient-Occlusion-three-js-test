
TextureVisualizeShader = {
	defines: {
		
	},

	uniforms: {

		"tTexture": { value: null },
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
	
		"uniform sampler2D tTexture;",
		
		"varying vec2 vUv;",

		"void main() {",

			"vec4 texel = texture2D( tTexture, vUv );",
			"gl_FragColor = vec4(texel.xyz, 1.0);",

		"}"

	].join( "\n" )

};
