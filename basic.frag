// frag shader code is based on code from Daniel Shiffman, Inigo Quilez, Jamie Wong, Martijn Steinrucken (aka the Art of Coding)

// Mandelbulb challenge from theCodingTrain
// https://www.youtube.com/watch?v=NJCiUVGiNyA
// Exploration of how to port from Shadertoy
// https://www.youtube.com/watch?v=7ZIfXu_iPv4

// https://iquilezles.org
// The following link is provided for educational purposes
// https://www.shadertoy.com/view/ltfSWn

// http://jamie-wong.com/2016/07/15/ray-marching-signed-distance-functions/
// https://www.shadertoy.com/view/lt33z7

// Also refer to these wonderful tutorials
// YouTube: youtube.com/TheArtOfCodeIsCool
// Ray marching starting point
// https://www.shadertoy.com/view/WtGXDD

#ifdef GL_ES
precision mediump float;
#endif

// Passed in as a uniform from the sketch.js file
uniform vec2 u_resolution; 
uniform float iTime;
uniform vec2 iResolution;
uniform int iFrame;
uniform vec2 iMouse;

const int MAX_MARCHING_STEPS = 256;
const float MIN_DIST = 0.0;
const float MAX_DIST = 20.0;
const float epsilon = 0.0001;

#define MAX_STEPS 128

// function to extract polar coordinates
// comparable to Spherical class in coding train mandelbulb challenge
vec3 Spherical( in vec3 pos) 
{
   float r = sqrt(pos.x*pos.x + pos.y*pos.y + pos.z*pos.z);
   float theta = atan( sqrt(pos.x*pos.x + pos.y*pos.y), pos.z);
   float phi = atan(pos.y, pos.x);
   vec3 w = vec3(r, theta, phi);
   return w;
}

// signed distance function for the mandelbulb
// basic Coding Train algorithm, incorporating some code from Inigo Quilez, 

float mandelbulbSDF( in vec3 pos, out vec4 col) 
{
  vec3 zeta = pos;
  
  // from Inigo Quelez
  float m = dot(pos,pos);
  float dz = 1.0;
  
  float n = 8.0;
  
  // can set maxiterations lower to speed up render time
  const int maxiterations = 20;
  
  for ( int i = 0; i < maxiterations; i+=1) {
     
     // from Inigo Quilez
     dz = 8.0*pow(m, 3.5)*dz + 1.0;
    
     // From Coding Train challenge
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
     
   // distance estimation through the Hubbard-Douady potential from Inigo Quilez
   return 0.25*log(m) * sqrt(m) / dz;  
}

// Remainder of code adapted from Jamie Wong Ray Marching Part 2 in shadertoy
float sceneSDF(vec3 position) {
  vec4 edge;
  return mandelbulbSDF( position, edge );
}


// find ray direction
vec3 rayDirection(float fieldOfView, vec2 size, vec2 fragCoord) {
    vec2 xy =  1.18 * (gl_FragCoord.xy - size) ;
    float z = size.y / tan(radians(fieldOfView) / 2.0);
    return normalize(vec3(xy, -z));
}

// approximate the surface gradients by taking a small difference around the point
vec3 estimateNormal(vec3 p) {
    return normalize(vec3(
        sceneSDF(vec3(p.x + epsilon, p.y, p.z)) - sceneSDF(vec3(p.x - epsilon, p.y, p.z)),
        sceneSDF(vec3(p.x, p.y + epsilon, p.z)) - sceneSDF(vec3(p.x, p.y - epsilon, p.z)),
        sceneSDF(vec3(p.x, p.y, p.z  + epsilon)) - sceneSDF(vec3(p.x, p.y, p.z - epsilon))
    ));
}

// ray marching 
float shortestDistanceToSurface(vec3 eye, vec3 marchingDirection, float start, float end) {
    float depth = start;
    for (int i = 0; i <  256; i++) {
        float dist = sceneSDF(eye + depth * marchingDirection);
        if (dist < epsilon) {
			return depth;
        }
        depth += dist;
        if (depth >= end) {
            return end;
        }
    }
    return end;
}

// lighting function
vec3 phongContribForLight(vec3 k_d, vec3 k_s, float alpha, vec3 p, vec3 eye,
                          vec3 lightPos, vec3 lightIntensity) {
    vec3 N = estimateNormal(p);
    vec3 L = normalize(lightPos - p);
    vec3 V = normalize(eye - p);
    vec3 R = normalize(reflect(-L, N));
    
    float dotLN = dot(L, N);
    float dotRV = dot(R, V);
    
    if (dotLN < 0.0) {
        // Light not visible from this point on the surface
        return vec3(0.0, 0.0, 0.0);
    } 
    
    if (dotRV < 0.0) {
        // Light reflection in opposite direction as viewer, apply only diffuse
        // component
        return lightIntensity * (k_d * dotLN);
    }
    return lightIntensity * (k_d * dotLN + k_s * pow(dotRV, alpha));
}

// lighting function
vec3 phongIllumination(vec3 k_a, vec3 k_d, vec3 k_s, float alpha, vec3 p, vec3 eye) {
    const vec3 ambientLight = 0.5 * vec3(1.0, 1.0, 1.0);
    vec3 color = ambientLight * k_a;
    
    vec3 light1Pos = vec3(4.0, 2.0, 4.0);
  
    // this is the orignal code from Jamie Wong -- it breaks the code
    // vec3 light1Pos = vec3(4.0 * iTime,
    //                       2.0 ,
    //                       4.0 * iTime);
  
    vec3 light1Intensity = vec3(0.4, 0.4, 0.4);
    
    color += phongContribForLight(k_d, k_s, alpha, p, eye,
                                  light1Pos,
                                  light1Intensity);
    
    vec3 light2Pos = vec3(2.0 * sin(0.37),
                          2.0 * cos(0.37),
                          2.0);
    vec3 light2Intensity = vec3(0.4, 0.4, 0.4);
    
    color += phongContribForLight(k_d, k_s, alpha, p, eye,
                                  light2Pos,
                                  light2Intensity);    
    return color;
}

// render the mandelbulb
void main() {
  
  // camera origin
  vec3 eye = 0.95 * vec3(1.15, 1.1, 5.0);  
  
  
  // add a target for the camera
  vec3 ta = vec3(0.0,0.1,0.0);
    
  eye = eye + ta;
  
  // set camera orientation
  vec3 dir = rayDirection(55.0, u_resolution.xy, gl_FragCoord.xy); 
   
  float dist = shortestDistanceToSurface(eye, dir, MIN_DIST, MAX_DIST);
    
    if (dist > MAX_DIST - epsilon) {
        // Didn't hit anything
        gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
		return;
    }
  
 
  // The closest point on the surface to the eyepoint along the view ray
    vec3 p = eye + dist * dir;
    
    vec3 K_a = vec3(0.7, 0.1, 0.7);
    vec3 K_d = vec3(0.4, 0.4, 0.4);
    vec3 K_s = vec3(0.9, 0.9, 0.9);
    float shininess = 5.0;
    
    vec3 color = phongIllumination(K_a, K_d, K_s, shininess, p, eye);
    
  gl_FragColor = vec4(color,1.0); // R,G,B,A
}
