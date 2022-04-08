// frag shader code is based on code from Daniel Shiffman, Inigo Quilez, and Martijn Steinrucken (aka the Art of Coding)

// Mandelbulb challenge from theCodingTrain
// https://www.youtube.com/watch?v=NJCiUVGiNyA
// Exploration of how to port from Shadertoy
// https://www.youtube.com/watch?v=7ZIfXu_iPv4

// https://iquilezles.org/www/articles/mandelbulb/mandelbulb.htm

// YouTube: youtube.com/TheArtOfCodeIsCool
// Refer to the Ray marching starting point video for a good explanation of Ray marching 


#ifdef GL_ES
precision mediump float;
#endif

#define S smoothstep
#define B backgroundGradient

uniform vec2 u_resolution; // This is passed in as a uniform from the sketch.js file
uniform vec2 iMouse;
uniform float iFrame;
uniform float iTime;
uniform sampler2D tex0;

#define MAX_STEPS 100
#define MAX_DIST 100.
#define SURF_DIST .001
#define PURPLE vec3(83,29,109) / 255.
#define RED vec3(191, 18, 97) / 255.
#define ORANGE vec3(251,162,100) / 255.
#define BLUE vec3(118, 212,229) / 255.
#define TEXTURE texture2D(tex0, p.yz*.5+0.5).rgb

// Function to create a background gradient
vec3 backgroundGradient(vec2 uv, vec3 col1, vec3 col2, float m) {
  float k = uv.y*m + m;
  vec3 col = mix(col1, col2, k);
  return col;
}

// Function to add color to mandelbulb
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

mat2 Rot(float a) {
    float s=sin(a), c=cos(a);
    return mat2(c, -s, s, c);
}

// Function to extract polar coordinates from Mandelbulb coding challenge
vec3 Spherical( in vec3 pos) 
{
   float r = sqrt(pos.x*pos.x + pos.y*pos.y + pos.z*pos.z);
   float theta = atan( sqrt(pos.x*pos.x + pos.y*pos.y), pos.z);
   float phi = atan(pos.y, pos.x);
   vec3 w = vec3(r, theta, phi);
   return w;
}

// Signed istance function adapted from Mandelbulb coding challenge 
// with some additional code from Inigo Quilez
// You can find additional SDFs @ https://iquilezles.org/www/articles/distfunctions/distfunctions.htm
// You will need to edit the code in the GetDist function to the name of the new SDF
float mandelbulbSDF( in vec3 pos) 
{
  vec3 zeta = pos;
  float m = dot(pos,pos);
  float dz = 1.0;
  float n = 8.0;
  const int maxiterations = 20;
  
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

      m = dot (zeta, zeta);
      if ( m > 2.0)
         break;
   }
 
  // Distance estimation through the Hubbard-Douady potential from Inigo Quilez
   return 0.25*log(m) * sqrt(m) / dz;
   
}

// If you add two objects add them here and then use min() to get the min distance to both objects 
float GetDist(vec3 p) {
    float d = mandelbulbSDF(p);
    return d;
}

// The render gets a little pixelated when animated
vec3 Transform(vec3 p)
{
   // p.xy *= Rot(iFrame*.005);
   // p.xz *= Rot(iFrame*.005);
  
  return p;
}

float RayMarch(vec3 ro, vec3 rd) {
	float dO=0.;
    
    for(int i=0; i<MAX_STEPS; i++) {
    	vec3 p = Transform(ro + rd*dO);
        
        float dS = GetDist(p);
        dO += dS;
        if(dO>MAX_DIST || abs(dS)<SURF_DIST) break;
    }
    return dO;
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
    // Remap uvs to center of screen
    vec2 uv = (gl_FragCoord.xy -.5*u_resolution.xy)/u_resolution.y;
	vec2 m = iMouse.xy/u_resolution.xy;
   
    vec3 ro = vec3(0, 3, -3);  // Camera origin -- best to leave this alone 
    vec3 lookat = vec3(0.);  // Location of object
  
    ro.yz *= Rot(-m.y*3.14+1.);
    ro.xz *= Rot(-m.x*6.2831);
    
    float zoom = 1.3;  // Adjust this value to change size of object
  
    vec3 rd = GetRayDir(uv, ro, lookat, zoom);
  
    // Add background color with gradient
    vec3 col = B(uv, PURPLE, BLUE, .4);
   
    // Find distance to object
    float d = RayMarch(ro, rd);

    if(d<MAX_DIST) {
        vec3 p = Transform(ro + rd * d);
        vec3 n = GetNormal(p);
        vec3 r = reflect(rd, n);

        float dif = dot(n, normalize(vec3(1,2,3)))*.5+.5;
        col = vec3(dif);
        
        // Add color to the mandelbulb
        // This is not true color mapping as there is no edge detection
        // Any texture added to the mandelbulb gets added inside
        // Change code to clearbeads.png to see difference
        // The TEXTURE code is provided as a guide to add it to other objects
        col = colXYZ(PURPLE, RED, TEXTURE, n);
    }
    gl_FragColor = vec4(col,1.0);
}