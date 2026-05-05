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
    const ringData = [
      { size: 900, dur: 38, border: 'rgba(120,0,255,0.42)', dir: 'cw'  },
      { size: 680, dur: 28, border: 'rgba(80,0,200,0.38)',  dir: 'ccw' },
      { size: 490, dur: 20, border: 'rgba(50,0,180,0.34)',  dir: 'cw'  },
      { size: 320, dur: 14, border: 'rgba(100,0,255,0.42)', dir: 'ccw' },
      { size: 180, dur: 9,  border: 'rgba(150,0,255,0.52)', dir: 'cw'  },
    ];

    const dustData = [
      { r: 340, size: 3, dur: 22, delay: 0,   dir: 'cw'  },
      { r: 390, size: 4, dur: 29, delay: -9,  dir: 'ccw' },
      { r: 430, size: 2, dur: 18, delay: -5,  dir: 'cw'  },
      { r: 465, size: 5, dur: 34, delay: -15, dir: 'ccw' },
      { r: 500, size: 3, dur: 26, delay: -21, dir: 'cw'  },
      { r: 355, size: 2, dur: 21, delay: -3,  dir: 'ccw' },
      { r: 440, size: 4, dur: 31, delay: -12, dir: 'cw'  },
      { r: 480, size: 3, dur: 25, delay: -18, dir: 'ccw' },
      { r: 525, size: 2, dur: 40, delay: -27, dir: 'cw'  },
      { r: 405, size: 5, dur: 16, delay: -7,  dir: 'ccw' },
      { r: 455, size: 2, dur: 28, delay: -23, dir: 'cw'  },
      { r: 545, size: 3, dur: 45, delay: -32, dir: 'ccw' },
    ];

    const corners: Array<{ style: React.CSSProperties; w: number; h: number; dur: string; delay: string; origin: string }> = [
      { style: { top: 0, left: 0 },     w: 370, h: 370, dur: '5.2s', delay: '0s',    origin: '0% 0%'     },
      { style: { top: 0, right: 0 },    w: 310, h: 310, dur: '6.1s', delay: '-2.1s', origin: '100% 0%'   },
      { style: { bottom: 0, left: 0 },  w: 330, h: 330, dur: '4.7s', delay: '-1.4s', origin: '0% 100%'   },
      { style: { bottom: 0, right: 0 }, w: 390, h: 390, dur: '5.8s', delay: '-3.2s', origin: '100% 100%' },
    ];

    return (
      <div className="skin-effect-layer" aria-hidden="true">
        {/* Glow nas bordas — visível ao redor dos painéis */}
        <div className="void-edge void-edge-top"    style={{ animationDuration: '4s',   animationDelay: '0s'  }} />
        <div className="void-edge void-edge-bottom" style={{ animationDuration: '5s',   animationDelay: '-2s' }} />
        <div className="void-edge void-edge-left"   style={{ animationDuration: '4.5s', animationDelay: '-1s' }} />
        <div className="void-edge void-edge-right"  style={{ animationDuration: '5.5s', animationDelay: '-3s' }} />

        {/* Anéis do vórtice */}
        {ringData.map((r, i) => (
          <div
            key={`ring-${i}`}
            className={`void-ring ${r.dir === 'cw' ? 'void-ring-cw' : 'void-ring-ccw'}`}
            style={{
              width:             `${r.size}px`,
              height:            `${r.size}px`,
              animationDuration: `${r.dur}s`,
              borderColor:       r.border,
            }}
          />
        ))}

        {/* Partículas orbitando em raios grandes — aparecem nas laterais */}
        {dustData.map((p, i) => (
          <div
            key={`dust-${i}`}
            className={`void-dust void-dust-${p.dir}`}
            style={{
              width:             `${p.size}px`,
              height:            `${p.size}px`,
              animationDuration: `${p.dur}s`,
              animationDelay:    `${p.delay}s`,
              '--orbit-r':       `${p.r}px`,
            } as React.CSSProperties}
          />
        ))}

        {/* Blobs de energia nos 4 cantos */}
        {corners.map((c, i) => (
          <div
            key={`corner-${i}`}
            className="void-corner"
            style={{
              ...c.style,
              width:             `${c.w}px`,
              height:            `${c.h}px`,
              background:        `radial-gradient(circle at ${c.origin}, rgba(110,0,255,0.30) 0%, rgba(55,0,160,0.13) 45%, transparent 70%)`,
              animationDuration: c.dur,
              animationDelay:    c.delay,
            }}
          />
        ))}

        {/* Núcleo do buraco negro */}
        <div className="void-core" />
      </div>
    );
  }

  return null;
}
