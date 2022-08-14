// The frag shader code is based on code from Daniel Shiffman, Inigo Quilez, and Martijn Steinrucken (aka the Art of Coding)

// Mandelbulb challenge from theCodingTrain
// https://www.youtube.com/watch?v=NJCiUVGiNyA
// Exploration of how to port from Shadertoy to P5.js
// https://www.youtube.com/watch?v=7ZIfXu_iPv4

// https://iquilezles.org/www/articles/mandelbulb/mandelbulb.htm

// YouTube: youtube.com/TheArtOfCodeIsCool
// Refer to the Ray marching starting point video for a good explanation of Ray marching 

#ifdef GL_ES
precision mediump float;
#endif

// Pass in uniforms from the sketch.js file
uniform vec2 u_resolution; 
uniform float iTime;
uniform vec2 iMouse;
uniform float iFrame;
uniform int choice;

#define MAX_STEPS 100
#define MAX_DIST 100.
#define SURF_DIST .001

#define S smoothstep
#define T iTime
#define PI 3.14159

#define PURPLE vec3(146,83,161) / 255.
#define RED vec3(191, 18, 97) / 255.
#define ORANGE vec3(251,162, 100) / 255.
#define BLUE vec3(68, 48, 89) / 255.
#define GREEN vec3(102,211,52) / 255.
#define TEAL vec3(11, 106, 136) / 255.
#define AQUA vec3(45, 197, 244) / 255.
#define ROSE vec3(241, 97, 100) / 255.
#define MAGENTA vec3(164, 41, 99) / 255. 
#define PINK vec3(40, 99, 164) /255.
#define RASPBERRY vec3(236,1,90) /255.
//#define RASPBERRY vec3(250,35,183) /255.
#define DPURPLE vec3(112, 50, 126) / 255.
#define BUBBLE vec3(237, 78, 139) / 255.
#define PALEYELL vec3(253, 253, 175) / 255.
#define BRBLUE vec3(0, 0, 77) / 255.
//#define FUSHIA vec3(192, 34, 171) / 255.
#define FUSHIA vec3(165, 27, 152) / 255.
#define NAVY vec3(7,9,57) / 255.
#define YELLOW vec3(246, 235, 118) / 255.
#define OCEAN vec3(22,133, 222) / 255.
#define BLOODRED vec3(227,0,0) / 255.

// This is not really doing anything for this sketch, but this is how you pass in a texture
#define TEXTURE texture2D(tex0, p.yz*.5+0.5).rgb

// Function to create a color gradient
vec3 colorGradient(vec2 uv, vec3 col1, vec3 col2, float m) {
  float k = uv.y*m + m;
  vec3 col = mix(col1, col2, k);
  return col;
}

// Function to add color to mandelbulb using x,y,z dimensions
vec3 colXYZ( vec3 col1, vec3 col2, vec3 col3, vec3 n)
  {
        vec3 colXY = col1;  // front and back insdie and outside
        vec3 colXZ = col2; // top and bottom
        vec3 colYZ = col3;  //  left and right inside and outside
      
       // Tri-planar mapping
        n = abs(n);  // take absolute value to get all faces of cube
        n *= pow(n, vec3(5.));
        n /= n.x + n.y + n.z; // add normalization 
      
       vec3 col = colXZ*n.y + colXY*n.z + colYZ*n.x ; 
       return col;
}

// Function to take r,g,b values to range 0,1
// Remember to input a float!
vec3 rgb( float r, float g, float b) 
{
   return vec3(r/ 255.0, g / 255.0, b / 255.0);
}

float N21( vec2 p) {
    return fract( sin(p.x*100. + p.y*6574.)*5674. );
}


float SmoothNoise(vec2 uv) {
   // lv goes from 0,1 inside each grid
   // check out interpolation for dummies
    vec2 lv = fract(uv);
   
   //vec2 lv = smoothstep(0., 1., fract(uv*10.));  // create grid of boxes 
    vec2 id = floor(uv); // find id of each of the boxes
     lv = lv*lv*(3.-2.*lv); 
    
    // get noise values for each of the corners
    // Use mix function to join together
    float bl = N21(id);
    float br = N21(id+vec2(1,0));
    float b = mix (bl, br, lv.x);
    
    
    float tl = N21(id + vec2(0,1));
    float tr = N21(id+vec2(1,1));
    float t = mix (tl, tr, lv.x);
    
    return mix(b, t, lv.y);
}

float SmoothNoise2 (vec2 uv) {
   float c = SmoothNoise(uv*4.);
     // Layer(or octave) of noise
    // Double frequency of noise; half the amplitude
    c += SmoothNoise(uv*8.)*.5;
    c += SmoothNoise(uv*16.)*.25;
    c += SmoothNoise(uv*32.)*.125;
    c += SmoothNoise(uv*64.)*.0625;
    
    return c/ 2.;  // have to normalize or could go past 1
  
}
mat2 Rot(float a) {
    float s=sin(a), c=cos(a);
    return mat2(c, -s, s, c);
}

// function to extract polar coordinates
// from Daniel Shiffman
vec3 Spherical( in vec3 pos) 
{
   float r = sqrt(pos.x*pos.x + pos.y*pos.y + pos.z*pos.z);
   float theta = atan( sqrt(pos.x*pos.x + pos.y*pos.y), pos.z);
   float phi = atan(pos.y, pos.x);
   vec3 w = vec3(r, theta, phi);
   return w;
}

// mapping function
// adapted from IQ, incorporatin Coding Train variable names
vec2 mandelbulbSDF( vec3 pos) 
{
  vec3 zeta = pos;
  float m = dot(pos,pos);
  float dz = 1.0;
  float n = 8.0;
  const int maxiterations = 20;
  float iterations = 0.0;
  float r = 0.; 
   
   float dr = 1.;
   for ( int i = 0; i < maxiterations; i+=1) {
     dz = n*pow(m, 3.5)*dz + 1.0;
     vec3 sphericalZ = Spherical( zeta ); 
     float newx = pow(sphericalZ.x, n) * sin(sphericalZ.y*n) * cos(sphericalZ.z*n);
     float newy = pow(sphericalZ.x, n) * sin(sphericalZ.y*n) * sin(sphericalZ.z*n);
     float newz = pow(sphericalZ.x, n) * cos(sphericalZ.y*n);
     zeta.x = newx + pos.x;
     zeta.y = newy + pos.y;
     zeta.z = newz + pos.z;

     iterations += 1.0;
      m = dot (zeta, zeta);
      if ( m > 2.0)
         break;
   }
 
  // distance estimation through the Hubbard-Douady potential from IQ
   return vec2(0.25*log(m) * sqrt(m) / dz, iterations);
   
}

float GetDist(vec3 p) {
    //p.xz *= Rot(iTime*.1);
    float d = mandelbulbSDF(p).x;
  
    return d;
}

vec2 RayMarch(vec3 ro, vec3 rd) {
	float dO=0.0;
    float iter=0.0;
    for(int i=0; i<MAX_STEPS; i++) {
    	vec3 p = ro + rd*dO;
        float dS = GetDist(p);
        //float di = GetDist(p).y;
        dO += dS;
        iter += 1.0;
        if(dO>MAX_DIST || abs(dS)<SURF_DIST) break;
    }
    
    return vec2(dO, iter);
}

vec3 GetNormal(vec3 p) {
	float d = GetDist(p);
    vec2 e = vec2(.001, 0);
    
    vec3 n = d - vec3(
        GetDist(p-e.xyy),
        GetDist(p-e.yxy),
        GetDist(p-e.yyx));
    
    return normalize(n);
}

vec3 GetRayDir(vec2 uv, vec3 p, vec3 l, float z) {
    vec3 f = normalize(l-p),
        r = normalize(cross(vec3(0,1,0), f)),
        u = cross(f,r),
        c = f*z,
        i = c + uv.x*r + uv.y*u,
        d = normalize(i);
    return d;
}

void main()
{
    vec2 uv = (gl_FragCoord.xy - .5*u_resolution.xy)/u_resolution.y;
	vec2 m = iMouse.xy/u_resolution.xy;

    vec3 ro = vec3(0, 3, -3);
    ro.yz *= Rot(-m.y*3.14+1.);
    ro.xz *= Rot(-m.x*6.2831);
    
   // Last parameter--lens of camera
   // Increase to zoom in
    vec3 rd = GetRayDir(uv, ro, vec3(0,0.,0), 1.75); 
   
    vec3 col = vec3(0);
  
    // Choose background color
    if (choice == 0) {
    col = BUBBLE;
    }
    else if (choice == 1) {
    col = BRBLUE;
    }
   else if (choice == 2) {
    col = FUSHIA;
   }
   else if (choice == 3) {
   col = YELLOW;
   }
   else if (choice == 4) {
   col = RASPBERRY;
   }
  else if (choice == 5) {
   col = OCEAN;
   }
  else if (choice == 6) {
   col = ROSE;
   }
  else if (choice == 7) {
   col = RASPBERRY;
   }
   else if (choice == 8) {
   col = RASPBERRY;
   }
   else if (choice == 9) {
   col = RASPBERRY;
   }
   else if (choice == 10) {
   col = BLOODRED;
   }
  
   // Start raymarching
   vec2 rm = RayMarch(ro, rd);

    if(rm.x<MAX_DIST) {
        vec3 p = ro + rd * rm.x;
        vec3 n = GetNormal(p);
        vec3 r = reflect(rd, n);

        float dif = dot(n, normalize(vec3(1,2,3)))*.5+.5;
      
     //Color mandelbulb by # iter / max_steps
    
    float es = rm.y/100.0;
   
    // You can play around with the the values inside this vector
    // change cos to sine, and change number multiplied by es
    // You can also multiply (1.0 - c1) by different color vectors to change color
    // of mandelbulb, i.e.  c = ( 1.0 - c1 )*PALEYELL;
   
    vec3 c1; 
    // Current color choices
    if (choice == 0) {
    //purple, pink, aqua
     c1 = vec3( cos(es * 20.0)*0.5 + 0.5, cos(es * 30.0)*0.5 + 0.5,  0.5  ); 
     } 
    else if (choice == 1) {
     // blue and aqua 
     c1 = vec3( cos(3.0)*0.5 + 0.5,  cos(es * 30.0)*0.5 + 0.5,  0.5 );
    } 
    else if (choice == 2) {
    // purple and green
      c1 = vec3( sin(es * 30.0 + 2.0*PI)*0.5 + 0.5 , cos(es * 30.0 + 1.0*PI)*0.5 + 0.5,  sin(es * 30.0 )*0.5 + 0.5  ); 
    } 
    else if (choice == 3) {
    // cream and raspberry
     c1 = vec3( cos(0.0 * 20.0)*0.5 + 0.5, cos(es * 30.0)*0.5 + 0.5,  0.5  ); 
    
    }
     else if (choice == 4) {
    // bright multi-colored
     c1 = vec3( cos(es * 20.0 + 1.0*PI)*0.5 + 0.5 , sin(es * 20.0 + 2.0*PI)*0.5 + 0.5,  cos(es * 20.0 )*0.5 + 0.5  ); 
    
    } else if (choice == 5) {
      // pink and blue
    c1 = vec3( cos(es * 30.0)*0.5 + 0.5,  0.5, cos(0.0 * 30.0)*0.5 + 0.5     ); 
     }  else if (choice == 6) {
       // teal and orange
     c1 = vec3( sin(es * 30.0)*0.5 + 0.5,  0.5, sin(0.0 * 30.0)*0.5 + 0.5     ); 
     }
      else if (choice == 7) {
       // purple
     c1 = vec3(  0.5, cos(es * 30.0)*0.5 + 0.5, cos(0.0 * 20.0)*0.5 + 0.5  ); 
     }
      else if (choice == 8) {
       // another multi - colored version
      c1 = vec3( sin(es * 30.0 + 1.0*PI)*0.5 + 0.5 , cos(es * 30.0 + 2.0*PI)*0.5 + 0.5,   0.5  ); 
     }
       else if (choice == 9) {
       // another slightly different multi - colored version
     c1 = vec3( cos(es * 30.0 + 1.0*PI)*0.5 + 0.5 , sin(es * 30.0 + 2.0*PI)*0.5 + 0.5,   0.5  ); 
     }
       else if (choice == 10) {
       // yellow and green -- not my favorite
     c1 = vec3( cos( es * 30.0 )*0.5 + 0.5 ,  0.5,  cos( 3.0 )*0.5 + 0.5  ); 
     }
    col = c1;
    }
  
   col = pow(col, vec3(.4545));	// gamma correction
    
    gl_FragColor = vec4(col,1.0);
}