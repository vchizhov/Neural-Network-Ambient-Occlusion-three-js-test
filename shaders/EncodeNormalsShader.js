

EncodeNormalsShader = {
	defines: {
		
	},

	uniforms: {
	},

	vertexShader: [
	
		"uniform mat4 modelViewMatrix;",
		"uniform mat4 projectionMatrix;",
		"attribute vec3 position;",
		"attribute vec3 normal;",
		"varying vec3 vNormal;",

		"void main() {",

			"vNormal = normalize((modelViewMatrix*vec4( normal, 0.0 ))).xyz;",
			"gl_Position = projectionMatrix*modelViewMatrix*vec4( position, 1.0 );",

		"}"

	].join( "\n" ),

	fragmentShader: [
		"precision mediump float;",
		"varying vec3 vNormal;",

		"void main() {",

			"gl_FragColor = vec4(0.5*vNormal+0.5, 1.0);",
		"}"

	].join( "\n" )

};
