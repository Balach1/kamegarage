import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, G, Line, Path, Text as SvgText } from "react-native-svg";

const MAX_RPM = 11000;

// Gauge geometry
const SIZE = 280;
const STROKE = 18;
const R = (SIZE - STROKE) / 2;

// 270° gauge: from -225° to 45°
const START_ANGLE = -225;
const SWEEP_ANGLE = 400;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function degToRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number) {
  const a = degToRad(angleDeg);
  return { x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) };
}

function describeArc(cx: number, cy: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, radius, startAngle);
  const end = polarToCartesian(cx, cy, radius, endAngle);

  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

type Props = {
  onFinished?: () => void;
};

export default function RpmSplashGauge({ onFinished }: Props) {
  const anim = useRef(new Animated.Value(0)).current; // 0..1
  const [rpm, setRpm] = useState(0);

  const finishedRef = useRef(false);

  const bgArcPath = useMemo(() => {
    const cx = SIZE / 2;
    const cy = SIZE / 2;
    return describeArc(cx, cy, R, START_ANGLE, START_ANGLE + SWEEP_ANGLE);
  }, []);

  useEffect(() => {
    finishedRef.current = false;

    const done = () => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      onFinished?.();
    };

    // ✅ FAILSAFE (if animation gets interrupted)
    const watchdog = setTimeout(done, 3200);

    // ✅ One-shot sequence: sweep up -> settle down (no loop)
    const seq = Animated.sequence([
      Animated.timing(anim, {
        toValue: 0.92, // ~10k
        duration: 1850,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(anim, {
        toValue: 0.18, // ~2k
        duration: 850,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.delay(200),
    ]);

    const sub = anim.addListener(({ value }) => {
      const next = Math.round(value * MAX_RPM);
      setRpm(next);
    });

    seq.start(({ finished }) => {
      clearTimeout(watchdog);
      if (finished) done();
      else done(); // still advance if interrupted
    });

    return () => {
      clearTimeout(watchdog);
      anim.removeListener(sub);
      seq.stop();
    };
  }, [anim, onFinished]);

  const needleRotate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [`${START_ANGLE}deg`, `${START_ANGLE + SWEEP_ANGLE}deg`],
  });

  const fillArcPath = useMemo(() => {
    const cx = SIZE / 2;
    const cy = SIZE / 2;
    const t = clamp(rpm / MAX_RPM, 0, 1);
    const endAngle = START_ANGLE + SWEEP_ANGLE * t;
    return describeArc(cx, cy, R, START_ANGLE, endAngle);
  }, [rpm]);

  const ticks = useMemo(() => [0, 3000, 6000, 9000, 11000], []);

  return (
    <View style={styles.wrap}>
      <View style={styles.gaugeWrap}>
        <Svg width={SIZE} height={SIZE}>
          <G>
            <Circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={STROKE}
              fill="none"
            />

            <Path
              d={bgArcPath}
              stroke="rgba(255,255,255,0.18)"
              strokeWidth={STROKE}
              strokeLinecap="round"
              fill="none"
            />

            <Path
              d={fillArcPath}
              stroke="rgba(255,80,80,0.95)"
              strokeWidth={STROKE}
              strokeLinecap="round"
              fill="none"
            />

            {Array.from({ length: 28 }).map((_, i) => {
              const t = i / 27;
              const angle = START_ANGLE + SWEEP_ANGLE * t;
              const outer = polarToCartesian(SIZE / 2, SIZE / 2, R + 2, angle);
              const inner = polarToCartesian(
                SIZE / 2,
                SIZE / 2,
                R - (i % 3 === 0 ? 18 : 10),
                angle
              );

              return (
                <Line
                  key={i}
                  x1={inner.x}
                  y1={inner.y}
                  x2={outer.x}
                  y2={outer.y}
                  stroke={i > 21 ? "rgba(255,80,80,0.85)" : "rgba(255,255,255,0.35)"}
                  strokeWidth={i % 3 === 0 ? 2.2 : 1.4}
                  strokeLinecap="round"
                />
              );
            })}

            {ticks.map((val) => {
              const t = val / MAX_RPM;
              const angle = START_ANGLE + SWEEP_ANGLE * t;
              const p = polarToCartesian(SIZE / 2, SIZE / 2, R - 36, angle);
              const label = val === 11000 ? "11" : String(Math.round(val / 1000));

              return (
                <SvgText
                  key={val}
                  x={p.x}
                  y={p.y + 6}
                  fontSize="16"
                  fontWeight="700"
                  fill="rgba(255,255,255,0.7)"
                  textAnchor="middle"
                >
                  {label}
                </SvgText>
              );
            })}
          </G>
        </Svg>

        <Animated.View
          pointerEvents="none"
          style={[
            styles.needleWrap,
            {
              transform: [{ rotate: needleRotate }],
            },
          ]}
        >
          <View style={styles.needle} />
          <View style={styles.needleHub} />
        </Animated.View>

        <View style={styles.readout}>
          <Text style={styles.readoutLabel}>RPM</Text>
          <Text style={styles.readoutValue}>{rpm.toLocaleString("en-GB")}</Text>
        </View>
      </View>

      <Text style={styles.brand}>Kame Garage</Text>
      <Text style={styles.sub}>Loading your build…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: "#0B0D12",
    alignItems: "center",
    justifyContent: "center",
  },
  gaugeWrap: {
    width: SIZE,
    height: SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  needleWrap: {
    position: "absolute",
    width: SIZE,
    height: SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  needle: {
    position: "absolute",
    width: 4,
    height: R - 22,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.95)",
    transform: [{ translateY: -(R - 22) / 2 }],
  },
  needleHub: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderWidth: 4,
    borderColor: "rgba(255,80,80,0.9)",
  },
  readout: {
    position: "absolute",
    bottom: 34,
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  readoutLabel: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 12,
    letterSpacing: 1.4,
    fontWeight: "700",
    marginBottom: 2,
  },
  readoutValue: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 22,
    fontWeight: "900",
  },
  brand: {
    marginTop: 18,
    color: "rgba(255,255,255,0.92)",
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  sub: {
    marginTop: 6,
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    fontWeight: "600",
  },
});
