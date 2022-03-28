// This code is based on the Mandelbulb Coding Train Challenge by Daniel Shiffman
// See the basic.frag file for more information
// This code renders a static image of the mandelbulb using ray marching with phong illumination. 

// You can find the code for other versions in my github respository
// https://github.com/kfahn22/mandelbulb
// Additional Shader resources cab be found here (work in progress)
// https://github.com/kfahn22/Shader-Resources


// I have found that it is best to pull colors from an image to only one dimension.
let textureImg;

// a shader variable
let theShader;

function preload() {
  // load the shader
  // monochromatic image works best
  // the image gets added to the "inside" of the mandelbulb
  textureImg = loadImage("assets/orange_sunset.PNG");
  theShader = loadShader('starter.vert', 'starter.frag');
}

function setup() {
  pixelDensity(1);
  // shaders require WEBGL mode to work
  createCanvas(800, 800, WEBGL);
  noStroke();
}

function draw() {
  background(0);

  // send resolution of sketch into shader
  theShader.setUniform('u_resolution', [width, height]);
  theShader.setUniform("iMouse", [mouseX, map(mouseY, 0, height, height, 0)]);
  theShader.setUniform("iFrame", frameCount);
  theShader.setUniform("iTime", millis() / 1000.);
  theShader.setUniform("tex0", textureImg);

  // shader() sets the active shader with our shader
  shader(theShader);

  // rect gives us some geometry on the screen
  rect(0, 0, width, height);
}