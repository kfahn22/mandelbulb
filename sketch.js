// This code is based on the Mandelbulb Coding Train Challenge by Daniel Shiffman
// See the frag file for more information
// This code renders a static image of the mandelbulb using ray marching with phong
// illumination. If you would like render a version you can move with the mouse change 
// frag file in loadShader to either movable.frag or regular.frag.

// a shader variable
let theShader;

function preload(){
  // load the shader
  // this version uses phong illumination to add lighting
   theShader = loadShader('basic.vert', 'crystal.frag');
  // use this to render a movable version; it takes longer to render
  // theShader = loadShader('basic.vert', 'crystal_movable.frag');  
  // this version renders a movable version w/o phong illumination
  // theShader = loadShader('basic.vert', 'regular.frag'); 
}

function setup() {
  pixelDensity(1);
  // shaders require WEBGL mode to work
  createCanvas(600, 600, WEBGL);
  noStroke();
}

function draw() {  
  // send resolution of sketch into shader
  theShader.setUniform('u_resolution', [width, height]);
  theShader.setUniform("iMouse", [mouseX, map(mouseY, 0, height, height, 0)]);
  //theShader.setUniform("iTime", [mouseX, millis()]);

  // shader() sets the active shader with our shader
  shader(theShader);

  // rect gives us some geometry on the screen
  rect(0,0,width, height);
}

