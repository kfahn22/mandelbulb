// This code is based on the Mandelbulb Coding Train Challenge by Daniel Shiffman
// See the starter.frag file for more information
// This code renders an image of the mandelbulb using ray marching. 

// You can find the code for other versions in my github respository
// https://github.com/kfahn22/mandelbulb

new p5(sa = () => {
  
    // a shader variable
    let theShader;
    
    sa.preload = () => {
      // load the shader
      theShader = sa.loadShader('starter.vert', 'starter.frag');
    }
    
    
    sa.setup = () => {
      sa.pixelDensity(1);
      // shaders require WEBGL mode to work
      divA = sa.createDiv(400, 400);
      divA.position(25,25);
      c0.parent(divA);
      c0 = sa.createCanvas(400, 400, sa.WEBGL);
      sa.noStroke();
      sa.noCursor();
      button0 = sa.createButton('SAVE TILE A');
      button0.position(25,525);
      button0.mousePressed(sa.saveTile0);
    }
    
    
    sa.draw = ()  => {  
      sa.background(0);
    
      // send resolution of sketch into shader
      theShader.setUniform('sa.u_resolution', [sa.width, sa.height]);
      theShader.setUniform("sa.iMouse", [sa.mouseX, sa.map(sa.mouseY, 0, sa.height, sa.height, 0)]);
      theShader.setUniform("sa.iFrame", sa.frameCount);
      
      // shader() sets the active shader with our shader
      sa.shader(theShader);
      //model(cubeObj);
      // rect gives us some geometry on the screen
      sa.rect(0,0,sa.width, sa.height);
      
    }
    
    sa.saveTile0 = () => {
          sa.saveCanvas(c0, 'm0.png');
      }
    
    });
    
    
    // new p5(sb = () => {
      
    // // a shader variable
    // let theShader;
    
    // sb.preload = () => {
    //   // load the shader
    //   theShader = sb.loadShader('starter.vert', 'starter.frag');
    // }
    
    
    // sb.setup = () => {
    //   sb.pixelDensity(1);
    //   // shaders require WEBGL mode to work
    //   divB = sb.createDiv(400, 400);
    //   divB.position(425,25);
    //   c1 = sb.createCanvas(400, 400, sb.WEBGL);
    //   c1.parent(divB);
    //   sb.noStroke();
    //   sb.noCursor();
    //   button1 = sa.createButton('SAVE TILE B');
    //   button1.position(650,525);
    //   button1.mousePressed(sb.saveTile1);
    // }
    
    
    // sb.draw = ()  => {  
    //   sb.background(0);
    
    //   // send resolution of sketch into shader
    //   theShader.setUniform('sb.u_resolution', [sb.width, sb.height]);
    //   theShader.setUniform("sb.iMouse", [sb.mouseX, sb.map(sb.mouseY, 0, sb.height, sb.height, 0)]);
    //   theShader.setUniform("sb.iFrame", sb.frameCount);
      
    //   // shader() sets the active shader with our shader
    //   sb.shader(theShader);
    //   //model(cubeObj);
    //   // rect gives us some geometry on the screen
    //   sb.rect(0,0,sb.width, sb.height);
      
    // }
    
    // sb.saveTile1 = () => {
    //       sb.saveCanvas(c1, 'm0.png');
    //   }
    
    // });