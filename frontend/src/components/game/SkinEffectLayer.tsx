import React from 'react';
import './SkinEffects.css';

interface Props {
  skinClass: string;
}

export function SkinEffectLayer({ skinClass }: Props): React.ReactNode {
  if (skinClass === 'skin-enchanted-forest') {
    const lefts  = [3, 9, 17, 23, 31, 38, 45, 52, 59, 66, 73, 80, 87, 92, 97];
    const delays = [0, 2.1, 0.7, 3.5, 1.3, 4.2, 0.3, 5.1, 2.8, 1.0, 3.9, 0.5, 2.4, 4.7, 1.8];
    const durs   = [9, 11, 8, 13, 7.5, 10, 9.5, 12, 8.5, 11.5, 7, 10.5, 9, 13, 8];
    const sizes  = [14, 16, 12, 18, 11, 15, 17, 13, 16, 14, 18, 12, 15, 11, 17];
    const emojis = ['🍃', '🍂', '🌿'];
    return (
      <div className="skin-effect-layer" aria-hidden="true">
        {[...Array(15)].map((_, i) => (
          <span
            key={i}
            className="forest-leaf"
            style={{
              left: `${lefts[i]}%`,
              animationDelay: `${delays[i]}s`,
              animationDuration: `${durs[i]}s`,
              fontSize: `${sizes[i]}px`,
            }}
          >
            {emojis[i % 3]}
          </span>
        ))}
      </div>
    );
  }

  if (skinClass === 'skin-sunset') {
    const RAY_COUNT = 100;
    const ANGLE_STEP = 360 / RAY_COUNT;
    return (
      <div className="skin-effect-layer" aria-hidden="true">
        {[...Array(RAY_COUNT)].map((_, i) => {
          const isMajor = i % 2 === 0;
          return (
            <div
              key={i}
              className="sun-ray"
              style={{
                '--ray-angle': `${i * ANGLE_STEP}deg`,
                width: isMajor ? '22px' : '10px',
                opacity: isMajor ? 0.7 : 0.3,
                animationDelay: `-${i * 0.15}s`,
              } as React.CSSProperties}
            />
          );
        })}
      </div>
    );
  }

  if (skinClass === 'skin-galaxy') {
    return (
      <div className="skin-effect-layer" aria-hidden="true">
        {[...Array(40)].map((_, i) => (
          <div
            key={i}
            className="galaxy-star"
            style={{
              left: `${(i * 37 + 13) % 100}%`,
              top: `${(i * 53 + 7) % 100}%`,
              animationDelay: `${(i * 0.37) % 5}s`,
              animationDuration: `${2 + (i % 4) * 0.8}s`,
              width: `${1 + (i % 3)}px`,
              height: `${1 + (i % 3)}px`,
            }}
          />
        ))}
        <div className="shooting-star" />
        <div className="shooting-star" style={{ animationDelay: '8s', top: '18%', left: '65%' }} />
      </div>
    );
  }

  if (skinClass === 'skin-neon-city') {
    const tops    = [8, 22, 38, 55, 70, 85];
    const delays  = [0, 2.3, 1.1, 3.7, 0.5, 4.5];
    const durs    = [6, 8, 5, 7, 9, 6.5];
    const colors  = ['#00fff9', '#ff00aa', '#aa00ff', '#00ff88', '#ff6600', '#0099ff'];
    const heights = [1, 2, 1, 2, 1, 2];
    return (
      <div className="skin-effect-layer" aria-hidden="true">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="neon-scan-line"
            style={{
              top: `${tops[i]}%`,
              animationDelay: `${delays[i]}s`,
              animationDuration: `${durs[i]}s`,
              background: colors[i],
              boxShadow: `0 0 8px 2px ${colors[i]}`,
              height: `${heights[i]}px`,
            }}
          />
        ))}
      </div>
    );
  }

  if (skinClass === 'skin-dark-void') {
    const sizes    = [800, 600, 420, 280, 160];
    const spinDurs = [30, 22, 16, 11, 8];
    const borders  = [
      'rgba(100,0,255,0.28)', 'rgba(60,0,200,0.22)',
      'rgba(30,0,180,0.18)',  'rgba(80,0,255,0.22)',
      'rgba(120,0,255,0.32)',
    ];
    return (
      <div className="skin-effect-layer" aria-hidden="true">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={`void-ring ${i % 2 === 0 ? 'void-ring-cw' : 'void-ring-ccw'}`}
            style={{
              width: `${sizes[i]}px`,
              height: `${sizes[i]}px`,
              animationDuration: `${spinDurs[i]}s`,
              borderColor: borders[i],
            }}
          />
        ))}
        <div className="void-core" />
      </div>
    );
  }

  return null;
}
