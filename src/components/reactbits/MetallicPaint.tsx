/**
 * MetallicPaint Component
 * WebGL2-based metallic paint effect inspired by ReactBits
 * Features liquid chrome animations with team color integration
 */

import React, { useEffect, useRef, useState } from "react";

type ShaderParams = {
  patternScale: number;
  refraction: number;
  edge: number;
  patternBlur: number;
  liquid: number;
  speed: number;
};

const defaultParams: ShaderParams = {
  patternScale: 2,
  refraction: 0.015,
  edge: 1,
  patternBlur: 0.005,
  liquid: 0.07,
  speed: 0.3,
};

const vertexShaderSource = `#version 300 es
precision mediump float;

in vec2 a_position;
out vec2 vUv;

void main() {
    vUv = .5 * (a_position + 1.);
    gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const liquidFragSource = `#version 300 es
precision mediump float;

in vec2 vUv;
out vec4 fragColor;

uniform float u_time;
uniform float u_ratio;
uniform float u_patternScale;
uniform float u_refraction;
uniform float u_edge;
uniform float u_patternBlur;
uniform float u_liquid;
uniform vec3 u_teamColor;

#define TWO_PI 6.28318530718
#define PI 3.14159265358979323846

vec3 mod289(vec3 x) { return x - floor(x * (1. / 289.)) * 289.; }
vec2 mod289(vec2 x) { return x - floor(x * (1. / 289.)) * 289.; }
vec3 permute(vec3 x) { return mod289(((x*34.)+1.)*x); }

float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1., 0.) : vec2(0., 1.);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0., i1.y, 1.)) + i.x + vec3(0., i1.x, 1.));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.);
    m = m*m;
    m = m*m;
    vec3 x = 2. * fract(p * C.www) - 1.;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130. * dot(m, g);
}

vec2 rotate(vec2 uv, float th) {
    return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv;
}

void main() {
    vec2 uv = vUv;
    uv.y = 1. - uv.y;
    uv.x *= u_ratio;
    
    float diagonal = uv.x - uv.y;
    float t = .001 * u_time;
    
    vec3 color = vec3(0.);
    float opacity = 1.;
    
    // Use team color as base
    vec3 color1 = mix(vec3(.98, 0.98, 1.), u_teamColor, 0.3);
    vec3 color2 = vec3(.1, .1, .1 + .1 * smoothstep(.7, 1.3, uv.x + uv.y));
    
    // Create metallic edge effect
    float edge = smoothstep(0.3, 0.7, length(uv - 0.5));
    
    vec2 grad_uv = uv;
    grad_uv -= .5;
    float dist = length(grad_uv + vec2(0., .2 * diagonal));
    grad_uv = rotate(grad_uv, (.25 - .2 * diagonal) * PI);
    
    float bulge = pow(1.8 * dist, 1.2);
    bulge = 1. - bulge;
    bulge *= pow(uv.y, .3);
    
    float cycle_width = u_patternScale;
    float noise = snoise(uv - t);
    edge += (1. - edge) * u_liquid * noise;
    
    // Create flowing metallic pattern
    float dir = grad_uv.x;
    dir += diagonal;
    dir -= 2. * noise * diagonal * (smoothstep(0., 1., edge) * smoothstep(1., 0., edge));
    dir *= cycle_width;
    dir -= t;
    
    // Apply refraction with team color influence
    float refr = u_refraction * (1. + 0.5 * dot(u_teamColor, vec3(0.299, 0.587, 0.114)));
    
    float stripe = mod(dir + refr, 1.);
    float metallic = smoothstep(0.2, 0.8, stripe);
    
    // Blend colors with metallic effect
    color = mix(color2, color1, metallic);
    color = mix(color, u_teamColor, 0.2 * metallic);
    
    // Add highlight based on team color brightness
    float brightness = dot(u_teamColor, vec3(0.299, 0.587, 0.114));
    color += brightness * 0.3 * metallic;
    
    opacity = smoothstep(0.1, 0.9, edge);
    color *= opacity;
    
    fragColor = vec4(color, opacity);
}
`;

interface MetallicPaintProps {
  teamColor?: string;
  params?: Partial<ShaderParams>;
  className?: string;
}

export default function MetallicPaint({
  teamColor = '#FEBE10',
  params = {},
  className = ''
}: MetallicPaintProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gl, setGl] = useState<WebGL2RenderingContext | null>(null);
  const [uniforms, setUniforms] = useState<Record<string, WebGLUniformLocation>>({});
  const totalAnimationTime = useRef(0);
  const lastRenderTime = useRef(0);
  
  const finalParams = { ...defaultParams, ...params };

  // Convert hex color to RGB
  const hexToRgb = (hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result 
      ? [
          parseInt(result[1], 16) / 255,
          parseInt(result[2], 16) / 255,
          parseInt(result[3], 16) / 255
        ]
      : [1, 1, 1];
  };

  useEffect(() => {
    function initShader() {
      const canvas = canvasRef.current;
      const gl = canvas?.getContext("webgl2", {
        antialias: true,
        alpha: true,
      });
      if (!canvas || !gl) {
        console.warn('WebGL2 not supported, falling back to basic display');
        return;
      }

      function createShader(
        gl: WebGL2RenderingContext,
        sourceCode: string,
        type: number
      ) {
        const shader = gl.createShader(type);
        if (!shader) return null;

        gl.shaderSource(shader, sourceCode);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          console.error(
            "Shader compile error: " + gl.getShaderInfoLog(shader)
          );
          gl.deleteShader(shader);
          return null;
        }

        return shader;
      }

      const vertexShader = createShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
      const fragmentShader = createShader(gl, liquidFragSource, gl.FRAGMENT_SHADER);
      const program = gl.createProgram();
      
      if (!program || !vertexShader || !fragmentShader) {
        console.error('Failed to create shader program');
        return;
      }

      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("Shader link error: " + gl.getProgramInfoLog(program));
        return;
      }

      // Get uniforms
      const uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
      const uniforms: Record<string, WebGLUniformLocation> = {};
      
      for (let i = 0; i < uniformCount; i++) {
        const uniformInfo = gl.getActiveUniform(program, i);
        if (uniformInfo) {
          const location = gl.getUniformLocation(program, uniformInfo.name);
          if (location) {
            uniforms[uniformInfo.name] = location;
          }
        }
      }
      
      setUniforms(uniforms);

      // Setup vertices
      const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
      const vertexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

      gl.useProgram(program);

      const positionLocation = gl.getAttribLocation(program, "a_position");
      gl.enableVertexAttribArray(positionLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      setGl(gl);
    }

    initShader();
  }, []);

  // Update uniforms when params or team color changes
  useEffect(() => {
    if (!gl || !uniforms) return;

    const [r, g, b] = hexToRgb(teamColor);
    
    if (uniforms.u_edge) gl.uniform1f(uniforms.u_edge, finalParams.edge);
    if (uniforms.u_patternBlur) gl.uniform1f(uniforms.u_patternBlur, finalParams.patternBlur);
    if (uniforms.u_patternScale) gl.uniform1f(uniforms.u_patternScale, finalParams.patternScale);
    if (uniforms.u_refraction) gl.uniform1f(uniforms.u_refraction, finalParams.refraction);
    if (uniforms.u_liquid) gl.uniform1f(uniforms.u_liquid, finalParams.liquid);
    if (uniforms.u_teamColor) gl.uniform3f(uniforms.u_teamColor, r, g, b);
  }, [gl, uniforms, teamColor, finalParams]);

  // Animation loop
  useEffect(() => {
    if (!gl || !uniforms) return;

    let renderId: number;

    function render(currentTime: number) {
      if (!gl || !uniforms) return;
      
      const deltaTime = currentTime - lastRenderTime.current;
      lastRenderTime.current = currentTime;

      totalAnimationTime.current += deltaTime * finalParams.speed;
      
      if (uniforms.u_time) {
        gl.uniform1f(uniforms.u_time, totalAnimationTime.current);
      }
      
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      renderId = requestAnimationFrame(render);
    }

    lastRenderTime.current = performance.now();
    renderId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(renderId);
    };
  }, [gl, uniforms, finalParams.speed]);

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gl || !uniforms) return;

    function resizeCanvas() {
      if (!canvas || !gl || !uniforms) return;
      
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      
      gl.viewport(0, 0, canvas.width, canvas.height);
      
      const ratio = canvas.width / canvas.height;
      if (uniforms.u_ratio) {
        gl.uniform1f(uniforms.u_ratio, ratio);
      }
    }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [gl, uniforms]);

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      <canvas 
        ref={canvasRef} 
        className="block w-full h-full object-cover"
        style={{ 
          imageRendering: 'pixelated',
          filter: 'contrast(1.1) saturate(1.2)'
        }}
      />
      {!gl && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 text-white">
          <div className="text-center">
            <div className="text-lg font-semibold mb-2">WebGL2 Not Supported</div>
            <div className="text-sm opacity-70">Showing fallback display</div>
          </div>
        </div>
      )}
    </div>
  );
}