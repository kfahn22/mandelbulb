// The frag shader code is based on code from Daniel Shiffman, Inigo Quelez, Jamie Wong, Martijn Steinrucken (aka the Art of Coding)

// Mandelbulb challenge from theCodingTrain
// https://www.youtube.com/watch?v=NJCiUVGiNyA
// Exploration of how to port from Shadertoy
// https://www.youtube.com/watch?v=7ZIfXu_iPv4

// https://iquilezles.org/www/articles/

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
uniform float iTime;

// const int MAX_MARCHING_STEPS = 255;
const float MIN_DIST = 0.0;
const float MAX_DIST = 20.0;
const float epsilon = 0.0001;

#define BG backgroundGradient

// The uvs are floating point with a range of [0.0,1.0] so we normalize by dividing by 255.
#define PURPLE vec3(83, 29,109) / 255.
#define RED vec3(191, 18, 97) / 255.
#define ORANGE vec3(251,162, 100) / 255.
#define BLUE vec3(118, 212, 229) / 255.

// Function to add background color
vec3 backgroundGradient(vec2 uv, vec3 col1, vec3 col2, float m) {
  float k = uv.y*m + m;
  vec3 col = mix(col1, col2, k);
  return col;
}

// Function to extract polar coordinates
// Comparable to Spherical class in coding train mandelbulb challenge
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
  float rsq = dot(pos,pos);
  float dz = 1.0;
  vec3 edge;
  float n = 8.0;
  int iterations = 0;
  const int maxiterations = 20;
  
  for ( int i = 0; i < maxiterations; i++) {
      
     dz = n * pow(rsq, 3.5)*dz + 1.0; //from Inigo Quilez
     vec3 sphericalZ = Spherical( zeta ); 
     float newx = pow(sphericalZ.x, n) * sin(sphericalZ.y*n) * cos(sphericalZ.z*n);
     float newy = pow(sphericalZ.x, n) * sin(sphericalZ.y*n) * sin(sphericalZ.z*n);
     float newz = pow(sphericalZ.x, n) * cos(sphericalZ.y*n);
     zeta.x = newx + pos.x;
     zeta.y = newy + pos.y;
     zeta.z = newz + pos.z;
     
    rsq = dot (zeta, zeta);
     if ( rsq > 2.0)
         break;
   }
 
   // distance estimation through the Hubbard-Douady potential from Inigo Quelez
   return 0.25*log(rsq)*sqrt(rsq)/ dz;
}


// Ray marching function from Jamie Wong
float shortestDistanceToSurface(vec3 eye, vec3 marchingDirection, float start, float end) {
    float depth = start;
    for (int i = 0; i <  255; i++) {
        float dist = mandelbulbSDF(eye + depth * marchingDirection);
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

// // Ray marching algorithm from Inigo Quilez
float castRay( in vec3 ro, vec3 rd) 
{
 float t = 0.0;
  
 for ( int i = 0; i < 255; i ++ )
 {
   vec3 pos = ro + t*rd;
   
   float h = mandelbulbSDF( pos );
  
   if ( h<0.001 ) 
   break;
   t += h;
   if ( t > 20.0 ) break;
 }
 if ( t>20.0) t = -1.0;
 
 return t;
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

// Render the mandelbulb
void main() {
  
    // Normalized pixel coordinates (from 0 to 1)
    vec2 p = (2.0*gl_FragCoord.xy-u_resolution.xy)/u_resolution.y;
    // Time varying pixel color
   
    // add a target for the camera
    vec3 ta = vec3(0.0,0.0,0.0);
    
    float an = 0.005 * iTime;
    //float an = 10.0*iMouse.x/u_resolution.x;
    vec3 ro = ta + vec3(1.5*sin(an),0.0,1.5*cos(an));  // origin of camera (ta moves camera up)
    
   // lighting comes from Inigo Quilez Happy Jumping livestream
   
    vec3 ww = normalize( ta - ro); // target minus ray origin
    vec3 uu = normalize( cross(ww,vec3(0.,1.,0.)) );
    vec3 vv = normalize( cross(uu,ww) );
    
    vec3 rd = normalize( p.x*uu +p.y*vv +0.7*ww );  // lens of camera
  
    vec3 col = BG(p,PURPLE, BLUE, .2 ); //vec3(1.0, 0.866, 0.);
   
    float t = castRay( ro, rd);
  
   if ( t > 0.0 )
  {
      vec3 pos = ro + t*rd;
      vec3 nor = calcNormal(pos);
      
      // Base color for mandelbulb
      vec3 mate = BG(p, RED, PURPLE, .8);
      
      vec3 sun_dir = normalize(vec3(1.0,0.2,0.2) );
      float sun_dif = clamp( dot(nor,sun_dir),0.0,1.0);
     
     // add shallows; offset to prevent self intersections 
      float dist = shortestDistanceToSurface(pos + nor*0.001, sun_dir, MIN_DIST, MAX_DIST);
      float sun_sha = step(dist, 0.05); 
      float sky_dif = clamp( 0.5 + 0.5*dot(nor,vec3(0.0,1.0,0.0)), 0.0, 1.0);
     
     // add bounce lighting reflecting back; (-) points down
     float bou_dif = clamp( 0.5 + 0.5*dot(nor,vec3(0.0,-1.0,0.0)), 0.0, 1.0); 
      
     float dif = 0.5 + clamp(0.5* dot(nor,sun_dir), 1.0, 1.0);
     
     // add key lighting
       
     //col = mate*vec3(7.0,4.0,4.0)*sun_dif*sun_sha; 
      col = mate*vec3(1.0,1.0,1.0)*sun_dif*sun_sha; 
     col += mate*vec3(0.5,0.8,0.9)*sky_dif; // fill light has a value about 1
     col += mate*vec3(0.7,0.5,0.3)*bou_dif; 
   }
  
     // include gamma correction right from beginning 
    //col = pow( col, vec3(0.4545) ); 
    
    // Output to screen
    gl_FragColor = vec4(col,1.0);
}

