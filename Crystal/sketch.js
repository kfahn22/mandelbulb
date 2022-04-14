// This code is based on the Mandelbulb Coding Train Challenge by Daniel Shiffman
// See the starter.frag file for more information
// This code renders a static image of the mandelbulb using ray marching with phong illumination. 

// You can find the code for other versions that you can rotate in my github respository
// The code currently needs work to make it run faster and improve lighting
// https://github.com/kfahn22/mandelbulb


// a shader variable
let theShader;

function preload(){
  // load the shader
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

  // shader() sets the active shader with our shader
  shader(theShader);

  // rect gives us some geometry on the screen
  rect(0,0,width, height);
}

// function mousePressed() {
// saveFrames('crystal_mandelbulb', 'png', 1, 1);

// }