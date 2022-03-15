// frag shader code is based on code from Daniel Shiffman, Inigo Quilez, Jamie Wong, Martijn Steinrucken (aka the Art of Coding)

// Mandelbulb challenge from theCodingTrain
// https://www.youtube.com/watch?v=NJCiUVGiNyA
// Exploration of how to port from Shadertoy
// https://www.youtube.com/watch?v=7ZIfXu_iPv4

// https://iquilezles.org/www/articles/mandelbulb/mandelbulb.htm

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
uniform vec2 iMouse;
uniform float iTime;
// Global variables
const int MAX_MARCHING_STEPS = 255;
const float MIN_DIST = 0.0;
const float MAX_DIST = 20.0;
const float epsilon = 0.0001;

// Function to extract polar coordinates
// Comparable to Spherical class in Coding Train mandelbulb challenge
vec3 Spherical( in vec3 pos) 
{
   float r = sqrt(pos.x*pos.x + pos.y*pos.y + pos.z*pos.z);
   float theta = atan( sqrt(pos.x*pos.x + pos.y*pos.y), pos.z);
   float phi = atan(pos.y, pos.x);
   vec3 w = vec3(r, theta, phi);
   return w;
}

// Signed distance function for the mandelbulb
// Based on processing sketch from Coding Train mandelbulb challenge, incorporating shader code from Inigo Quilez, 
float mandelbulbSDF( in vec3 pos, out vec4 col) 
{
  vec3 zeta = pos;
  
  // from Inigo Quelez
  float m = dot(pos,pos);
  float dz = 1.0;
  
  // From Coding Train challenge
  float n = 8.0;
  const int maxiterations = 20;
  
  for ( int i = 0; i < maxiterations; i+=1) {
     
     // from Inigo Quilez
     dz = n * pow(m, 3.5)*dz + 1.0;
    
     // from Coding Train
     vec3 sphericalZ = Spherical( zeta ); 
     float newx = pow(sphericalZ.x, n) * sin(sphericalZ.y*n) * cos(sphericalZ.z*n);
     float newy = pow(sphericalZ.x, n) * sin(sphericalZ.y*n) * sin(sphericalZ.z*n);
     float newz = pow(sphericalZ.x, n) * cos(sphericalZ.y*n);
     zeta.x = newx + pos.x;
     zeta.y = newy + pos.y;
     zeta.z = newz + pos.z;
     
     // from Inigo Quilez
     m = dot (zeta, zeta);
     if ( m > 2.0)
         break;
   }
     
   // distance estimation through the Hubbard-Douady potential 
   return 0.25*log(m) * sqrt(m) / dz; 
}

// Remainder of code adapted from Jamie Wong Ray Marching Part 2 in shadertoy
float sceneSDF(vec3 position) {
  vec4 edge;
  return mandelbulbSDF( position, edge );
}

// Tetrahedron technique for calculating gradients from Inigo Quilez
// https://iquilezles.org/www/articles/normalsSDF/normalsSDF.htm
vec3 calcNormal ( vec3 pos )
{
  const float h = 0.0001;
  const vec2 k = vec2(1,-1);
  return normalize( k.xyy*sceneSDF( pos + k.xyy*h ) +
                    k.yyx*sceneSDF( pos + k.yyx*h ) +
                    k.yxy*sceneSDF( pos + k.yxy*h ) +
                    k.xxx*sceneSDF( pos + k.xxx*h ) 
                  );
}

// Ray marching 
float shortestDistanceToSurface(vec3 eye, vec3 marchingDirection, float start, float end) {
    float depth = start;
    for (int i = 0; i <  MAX_MARCHING_STEPS; i++) {
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

// Lighting function from Jamie Wong
vec3 phongContribForLight(vec3 k_d, vec3 k_s, float alpha, vec3 p, vec3 eye,
                          vec3 lightPos, vec3 lightIntensity) {
    vec3 N = calcNormal(p);
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

// Lighting function from Jamie Wong
vec3 phongIllumination(vec3 k_a, vec3 k_d, vec3 k_s, float alpha, vec3 p, vec3 eye) {
    const vec3 ambientLight = 0.5 * vec3(1.0, 1.0, 1.0);
    vec3 color = ambientLight * k_a;
    
    vec3 light1Pos = vec3(4.0, 2.0, 4.0);

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

// Render the mandelbulb
void main() {
  
  // Normalized pixel coordinates (from 0 to 1)
    vec2 p =  (2.0*gl_FragCoord.xy-u_resolution.xy)/u_resolution.y;
    // Time varying pixel color
   
    // Add a target for the camera
    vec3 ta = vec3(0.0,0.,0.0);
    
    float an = 10.0*iMouse.x/u_resolution.x;
    vec3 ro = ta +  vec3(1.45*sin(an),0.0,1.45*cos(an));  // origin of camera (ta moves camera up)
    
   // Lighting comes from Inigo Quilez Happy Jumping livestream
    vec3 ww = normalize( ta - ro); // target minus ray origin
    vec3 uu = normalize( cross(ww,vec3(0.,1.,0.)) );
    vec3 vv = normalize( cross(uu,ww) );
    
  // Get the ray direction
    vec3 rd = normalize( p.x*uu +p.y*vv + .8*ww );  // lens of camera
  
  float dist = shortestDistanceToSurface(ro, rd, MIN_DIST, MAX_DIST);
    
    if (dist > MAX_DIST - epsilon) {
        // Didn't hit anything
        gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
		return;
    }
  
 
  // The closest point on the surface to the eyepoint along the view ray
    vec3 eye = ro + dist * rd;
    
    vec3 K_a = vec3(0.7, 0.1, 0.7);
    vec3 K_d = vec3(0.4, 0.4, 0.4);
    vec3 K_s = vec3(0.9, 0.9, 0.9);
    float shininess = 5.0;
    
    vec3 color = phongIllumination(K_a, K_d, K_s, shininess, eye, ro);
    
  gl_FragColor = vec4(color,1.0); // R,G,B,A
}

