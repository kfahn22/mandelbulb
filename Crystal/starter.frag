// The frag shader code is based on code from Daniel Shiffman, Inigo Quelez, Martijn Steinrucken (aka the Art of Coding), and Jamie Wong

// Mandelbulb challenge from theCodingTrain
// https://www.youtube.com/watch?v=NJCiUVGiNyA
// Exploration of how to port from Shadertoy
// https://www.youtube.com/watch?v=7ZIfXu_iPv4

// https://iquilezles.org/www/articles/distfunctions/distfunctions.htm
// https://www.shadertoy.com/view/ltfSWn
// https://www.youtube.com/watch?v=Cfe5UQ-1L9Q

// http://jamie-wong.com/2016/07/15/ray-marching-signed-distance-functions/
// https://www.shadertoy.com/view/llt3R4

// YouTube: youtube.com/TheArtOfCodeIsCool
// Ray marching starting point
// https://www.shadertoy.com/view/WtGXDD

#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution; // This is passed in as a uniform from the sketch.js file

const int MAX_MARCHING_STEPS = 255;
const float MIN_DIST = 0.0;
const float MAX_DIST = 20.0;
const float EPSILON = 0.0001;

#define MAX_STEPS 128
#define BG backgroundGradient

// The uvs are floating point with a range of [0.0,1.0] so we normalize by dividing by 255.
#define PURPLE vec3(83, 29,109) / 255.
#define RED vec3(191, 18, 97) / 255.
#define ORANGE vec3(251,162, 100) / 255.
#define BLUE vec3(118, 212, 229) / 255.

// Function to create a background gradient
vec3 backgroundGradient(vec2 uv, vec3 col1, vec3 col2, float m) {
  float k = uv.y*m + m;
  vec3 col = mix(col1, col2, k);
  return col;
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

// mapping function
// adapted from IQ, incorporatin Coding Train variable names
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
 
  // distance estimation through the Hubbard-Douady potential from IQ
   return 0.25*log(m) * sqrt(m) / dz;
   
}


// from Jamie Wong
vec3 rayDirection(float fieldOfView, vec2 size, vec2 fragCoord) {
    vec2 xy =(gl_FragCoord.xy - size) / 2.0;
    float z = size.y / tan(radians(fieldOfView) / 2.0);
    return normalize(vec3(xy, -z));
}


// Tetrahedron technique for calculating gradients from Inigo Quilez
// https://iquilezles.org/www/articles/normalsSDF/normalsSDF.htm
vec3 calcNormal ( vec3 pos )
{
  const float h = 0.0001;
  const vec2 k = vec2(1,-1);
   return normalize( k.xyy*mandelbulbSDF( pos + k.xyy*h ) +
                    k.yyx*mandelbulbSDF( pos + k.yyx*h ) +
                    k.yxy*mandelbulbSDF( pos + k.yxy*h ) +
                    k.xxx*mandelbulbSDF( pos + k.xxx*h ) 
                  );
}

// from Jame Wong
float shortestDistanceToSurface(vec3 eye, vec3 marchingDirection, float start, float end) {
    float depth = start;
    for (int i = 0; i < MAX_MARCHING_STEPS; i++) {
        //float dist = sceneSDF(eye + depth * marchingDirection);
        float dist = mandelbulbSDF(eye + depth * marchingDirection);
        if (dist < EPSILON) {
			return depth;
        }
        depth += dist;
        if (depth >= end) {
            return end;
        }
    }
    return end;
}

// from Jame Wong
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

// Phong illumination code from Jamie Wong
vec3 phongIllumination(vec3 k_a, vec3 k_d, vec3 k_s, float alpha, vec3 p, vec3 eye) {
    const vec3 ambientLight = 0.5 * vec3(1.0, 1.0, 1.0);
    vec3 color = ambientLight * k_a;
    
    vec3 light1Pos = vec3(4.0 ,
                          2.0,
                          4.0 );
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

void main() {
    // Position of the pixel divided by resolution, to get normalized positions on the canvas
    vec2 uv = gl_FragCoord.xy/u_resolution.xy; 
    vec3 dir = rayDirection(90.0, u_resolution.xy, gl_FragCoord.xy);
    vec3 eye = 1.0*vec3(1.3, 1.2, 5.5);
    float dist = shortestDistanceToSurface(eye, dir, MIN_DIST, MAX_DIST);
  
    if (dist > MAX_DIST - EPSILON) {
        // Didn't hit anything
        vec3 bgcolor = BG(uv, PURPLE, BLUE, .2);
      
        gl_FragColor = vec4(bgcolor, 1.0);
		return;
    }
    
    //  add a target for the camera
    vec3 ta = vec3(0.0,0.1,0.0);
  
    //ro is ray origin
    //origin of camera (ta moves camera up)
    vec3 ro = ta;
    // The closest point on the surface to the eyepoint along the view ray
    vec3 p = eye + dist * dir;
    
    vec3 K_a = BG(uv, PURPLE, RED, .7); //adjust color here 
    vec3 K_d = vec3(0.4, 0.4, 0.4);
    vec3 K_s = vec3(0.9, 0.9, 0.9);
    float shininess = 5.0;
    
    vec3 color = phongIllumination(K_a, K_d, K_s, shininess, p, eye);
  
  gl_FragColor = vec4(color,1.0); // R,G,B,A
}

