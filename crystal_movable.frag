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
uniform float iFrame;

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
float mandelbulbSDF( in vec3 pos) 
{
  vec3 zeta = pos;
  
  // from Inigo Quelez
  float m = dot(pos,pos);
  float dz = 1.0;
  
  // From Coding Train challenge
  float n = 8.0; // code only works for n = 8.0 
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


// Ray marching algorithm adjusted from Inigo Quilez
float castRay( in vec3 ro, vec3 rd, float start, float end) 
{
 float t = start;
  
 for ( int i = 0; i < 255; i ++ )
 {
   vec3 pos = ro + t*rd;
   
   float h = mandelbulbSDF( pos );
  
   if ( h<0.001 ) 
      return t;
   t += h;
   if ( t > end ) break;
 }
  return end;
}

// Lighting function from Jamie Wong
vec3 phongContribForLight(vec3 k_d, vec3 k_s, float alpha, vec3 p, vec3 eye,
                          vec3 lightPos, vec3 lightIntensity) {
    
    vec3 N = calcNormal(p); //Normal
    vec3 L = normalize(lightPos - p);  // Light direction
    vec3 V = normalize(eye - p);  // View direction
    vec3 R = normalize(reflect(-L, N));  // Reflect direction
    
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
    const vec3 ambientLight = 0.65 * vec3(1.0, 1.0, 1.0);
    vec3 color = ambientLight * k_a;
    float an = 0.005 * iFrame;
    vec3 light1Pos = vec3(4.0 * sin(an),
                          2.0,
                          4.0 * cos(an) );

    vec3 light1Intensity = vec3(0.4, 0.4, 0.4);
    
    color += phongContribForLight(k_d, k_s, alpha, p, eye,
                                  light1Pos,
                                  light1Intensity);
    
     vec3 light2Pos = vec3(2.0 * sin(0.37),
                          2.0 * cos(0.37),
                          2.0);
  
    vec3 light2Intensity = vec3(0.2, 0.2, 0.2);
    
    color += phongContribForLight(k_d, k_s, alpha, p, eye,
                                  light2Pos,
                                  light2Intensity);    
    return color;
}

// Render the mandelbulb
void main() {
  
  // Normalized pixel coordinates (from 0 to 1)
    vec2 p =  (2.0*gl_FragCoord.xy-u_resolution.xy)/u_resolution.y;
    
    // Add a target for the camera
    vec3 ta = vec3(0.0,0.0,0.0);
    
    float an = 0.005 * iFrame;
    
   // float an = 10.0*iMouse.x/u_resolution.x;  // uncomment to get a static image

   // origin of camera (ta moves camera up)
   vec3 ro = ta +  vec3(1.45*sin(an),0.0,1.45*cos(an));  
    
   float zoom = 0.75;  // zoom level for camera
  
   // Create basis vectors 
   // ww is the forward vector
   // vv is the up vector
   // normalize so that vectors are have unit length
    vec3 ww = normalize( ta - ro); // target minus ray origin
    vec3 uu = normalize( cross(ww,vec3(0.,1.,0.)) ); //(0,1,0) is the world up vector
    vec3 vv = normalize( cross(uu,ww) );
    
    vec3 rd = normalize( p.x*uu +p.y*vv + zoom * ww );  // lens of camera
  
   float dist = castRay(ro, rd, MIN_DIST, MAX_DIST);
    
    if (dist > MAX_DIST - epsilon) {
        // Didn't hit anything
        gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
		return;
    }
  
  // The closest point on the surface to the eyepoint along the view ray
    vec3 eye = ro + dist * rd;
    
    vec3 K_a = vec3(0.5, 0.7, 1.0);  // Ambient color -- change RGB values here
    vec3 K_d = vec3(0.4, 0.4, 0.4);  // Diffuse Color
    vec3 K_s = vec3(0.3, 0.3, 0.3);  // Specular color
    float shininess = 5.0;
    
    vec3 color = phongIllumination(K_a, K_d, K_s, shininess, eye, ro);
    
  gl_FragColor = vec4(color,1.0); // R,G,B,A
}

