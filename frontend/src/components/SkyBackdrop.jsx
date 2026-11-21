import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Ellipse, G, Line, Path } from 'react-native-svg';
import { getHijriDate } from '../utils/hijri';
import { phaseFromHijriDay } from './MoonPhase';
import { skyState, skyTint } from '../utils/sky';

// Background only: it sits behind the hero's name and Hijri chip, so it must
// never take touches or joins the accessibility tree as content. The visual
// itself is described once on the hero's own accessibility label.
const DECORATIVE = {
  pointerEvents: 'none',
  accessible: false,
  importantForAccessibility: 'no-hide-descendants',
  accessibilityElementsHidden: true,
};

/** Seven fixed stars — deterministic, so the sky does not jitter on re-render. */
const STARS = [
  { x: 8, y: 22, r: 1.2 }, { x: 21, y: 48, r: 0.9 }, { x: 37, y: 14, r: 1.1 },
  { x: 52, y: 63, r: 0.8 }, { x: 66, y: 30, r: 1.3 }, { x: 78, y: 66, r: 0.9 },
  { x: 90, y: 18, r: 1.0 },
];

function Sun({ size = 58 }) {
  const c = size / 2;
  const rays = Array.from({ length: 8 }, (_, i) => {
    const angle = (Math.PI / 4) * i;
    return {
      x1: c + Math.cos(angle) * (c * 0.62),
      y1: c + Math.sin(angle) * (c * 0.62),
      x2: c + Math.cos(angle) * (c * 0.92),
      y2: c + Math.sin(angle) * (c * 0.92),
    };
  });

  return (
    <Svg width={size} height={size}>
      <Circle cx={c} cy={c} r={c * 0.92} fill="rgba(255, 214, 130, 0.10)" />
      <Circle cx={c} cy={c} r={c * 0.70} fill="rgba(255, 218, 140, 0.16)" />
      {rays.map((ray, i) => (
        <Line
          key={i}
          x1={ray.x1}
          y1={ray.y1}
          x2={ray.x2}
          y2={ray.y2}
          stroke="rgba(255, 224, 152, 0.55)"
          strokeWidth={1.6}
          strokeLinecap="round"
        />
      ))}
      <Circle cx={c} cy={c} r={c * 0.40} fill="#FFE1A0" fillOpacity={0.95} />
    </Svg>
  );
}

/**
 * The same three-shape terminator as `MoonPhase`, but caption-free, on a
 * backdrop and tuned to sit on the brand gradient rather than a dark card.
 */
function Moon({ size = 52, phase = 0.5 }) {
  const r = size / 2 - 3;
  const c = size / 2;
  const k = Math.cos(2 * Math.PI * phase); // +1 new, -1 full
  const waxing = phase < 0.5;
  const lit = '#F3E6C6';
  const shadow = 'rgba(18, 26, 46, 0.55)';

  const halfPath = waxing
    ? `M ${c} ${c - r} A ${r} ${r} 0 0 1 ${c} ${c + r} Z`
    : `M ${c} ${c - r} A ${r} ${r} 0 0 0 ${c} ${c + r} Z`;

  return (
    <Svg width={size} height={size}>
      <Circle cx={c} cy={c} r={r * 1.55} fill="rgba(243, 230, 198, 0.12)" />
      <G>
        <Circle cx={c} cy={c} r={r} fill={shadow} stroke={lit} strokeWidth="0.8" strokeOpacity="0.4" />
        <Path d={halfPath} fill={lit} />
        <Ellipse cx={c} cy={c} rx={Math.abs(k) * r} ry={r} fill={k > 0 ? shadow : lit} />
        <Circle cx={c} cy={c} r={r} fill="none" stroke={lit} strokeWidth="0.8" strokeOpacity="0.6" />
      </G>
    </Svg>
  );
}

/**
 * Sun or moon, positioned for the current moment, behind the hero's name and
 * Hijri date. Purely decorative; the hero text carries the real information.
 *
 * @param {object} props
 * @param {Date} [props.now]
 * @param {Array<{name:string, mins:number}>} [props.prayers] cached timings
 * @param {number} [props.hijriDay] today's Hijri day, for the moon phase
 */
export default function SkyBackdrop({ now = new Date(), prayers = null, hijriDay }) {
  const state = skyState({ now, prayers });
  const day = Number.isFinite(hijriDay) ? hijriDay : getHijriDate(now).day;
  const phase = phaseFromHijriDay(day);

  return (
    <View style={StyleSheet.absoluteFill} {...DECORATIVE}>
      <LinearGradient
        colors={skyTint(state.phase)}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {state.phase === 'night' || state.phase === 'dusk' ? (
        <Svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          width="100%"
          height="100%"
          style={StyleSheet.absoluteFill}
        >
          {STARS.map((star, i) => (
            <Circle key={i} cx={star.x} cy={star.y} r={star.r} fill="rgba(255, 255, 255, 0.65)" />
          ))}
        </Svg>
      ) : null}

      <View
        testID={state.body === 'moon' ? 'sky-moon' : 'sky-sun'}
        style={[
          styles.body,
          {
            left: `${state.x}%`,
            top: `${state.y}%`,
            opacity: state.phase === 'night' ? 0.95 : 0.85,
          },
        ]}
      >
        {state.body === 'moon' ? <Moon phase={phase} /> : <Sun />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    position: 'absolute',
    transform: [{ translateX: -26 }, { translateY: -26 }],
  },
});
